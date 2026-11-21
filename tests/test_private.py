"""个人档案：模板里不能有任何数据；脚本只看文件大小、不读内容；页面不读任何文件。"""
import json
import re
import subprocess
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
VIEWS = PROJECT / "LifeOS/90 系统/views"
sys.path.insert(0, str(PROJECT / "tools"))

import make_private  # noqa: E402


def test_private_templates_have_no_data():
    for name, text in make_private.TEMPLATES.items():
        rows = [l for l in text.splitlines() if l.startswith("|")]
        headers = {rows[i - 1] for i, l in enumerate(rows) if set(l) <= set("|- :")}  # 分隔行上面那行是表头
        for line in rows:
            if line not in headers and not set(line) <= set("|- :"):
                cells = [c.strip() for c in line.strip("|").split("|")]
                assert all(c == "" for c in cells[1:]), (name, line)  # 第一列是栏目名，其余一律空着
        body = text.split("```", 2)[-1]
        assert not re.search(r"\d", body), name  # 正文没有数字


def test_profile_view_reads_only_its_own_note():
    js = (VIEWS / "profile/view.js").read_text(encoding="utf-8")
    for bad in ("dv.pages(", "L.lines(", "L.cards(", "fetch(", "XMLHttpRequest", "localStorage", "sessionStorage"):
        assert bad not in js, bad
    loads = re.findall(r'dv\.io\.load\(([^)]+)\)', js)
    assert all(x.startswith('"90 系统/views/_shared/') or x == "HERE" for x in loads), loads  # 只加载共用工具和这篇笔记自己
    assert "app.vault.process(L.fileOf(HERE)" in js


def test_private_not_synced_doc():
    doc = (PROJECT / "LifeOS/90 系统/个人档案使用说明.md").read_text(encoding="utf-8")
    for word in ("AirDrop", "不上传", "Sync 排除", "忘记密码"):
        assert word in doc, word


def test_make_private_only_fills_empty(tmp_path):
    folder = tmp_path / "60 个人档案"
    folder.mkdir()
    (folder / "个人档案.md").write_text("", encoding="utf-8")           # Obsidian 自动建的空白笔记
    r = subprocess.run([sys.executable, str(PROJECT / "tools/make_private.py"), str(tmp_path)], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    assert 'dv.view("90 系统/views/profile")' in (folder / "个人档案.md").read_text(encoding="utf-8")
    (folder / "个人档案.md").write_text("我自己写的", encoding="utf-8")   # 已经有内容
    r = subprocess.run([sys.executable, str(PROJECT / "tools/make_private.py"), str(tmp_path)], capture_output=True, text=True)
    assert (folder / "个人档案.md").read_text(encoding="utf-8") == "我自己写的"   # 没被覆盖
    assert (folder / "个人档案（模板）.md").exists()
    assert "我自己写的" not in r.stdout + r.stderr                               # 不打印内容


VAULT_JS = VIEWS / "_shared/vault.js"


def _vault(js: str):
    script = ("const V = eval(require('fs').readFileSync(%s, 'utf8'));\n(async () => { const out = await (async () => { %s })();"
              " console.log(JSON.stringify(out)); })().catch((e) => { console.log(JSON.stringify({error: e.message})); });") % (json.dumps(str(VAULT_JS)), js)
    return json.loads(subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True).stdout)


def test_vault_roundtrip_and_wrong_password():
    out = _vault("""
      const { sealed } = await V.create("pw-A", { body: [{ k: "体重", a: "50kg", b: "11月" }] });
      const ok = await V.unlock("pw-A", sealed);
      let wrong = null; try { await V.unlock("nope", sealed); } catch (e) { wrong = e.message; }
      return { sealed, data: ok.data, wrong, again: await V.seal(ok.key, ok.salt, ok.data) !== sealed };""")
    assert out["data"]["body"][0]["a"] == "50kg"
    assert out["wrong"] == "密码不对"
    assert out["again"]  # 每次保存换新的 IV
    assert out["sealed"].startswith("v1.") and "50kg" not in out["sealed"] and "体重" not in out["sealed"]


def test_vault_blob_in_note():
    out = _vault("""
      let t = "---\\na: 1\\n---\\n正文\\n";
      t = V.writeBlob(t, "profile", "v1.AAA.BBB.CCC");
      t = V.writeBlob(t, "accounts", "v1.DDD.EEE.FFF");
      t = V.writeBlob(t, "profile", "v1.XXX.YYY.ZZZ");
      return { t, p: V.readBlob(t, "profile"), a: V.readBlob(t, "accounts"), none: V.readBlob("正文", "profile") };""")
    assert out["p"] == "v1.XXX.YYY.ZZZ" and out["a"] == "v1.DDD.EEE.FFF" and out["none"] is None
    assert out["t"].count("lifeos-vault:profile") == 1


def test_vault_uses_strong_settings():
    js = VAULT_JS.read_text(encoding="utf-8")
    assert "PBKDF2" in js and "AES-GCM" in js and "SHA-256" in js
    assert int(re.search(r"ITER = (\d+)", js).group(1)) >= 300000
