import json
import subprocess
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
VAULT = PROJECT / "LifeOS"
WORKSPACE = PROJECT.parent

TOP_LEVEL = ["00 随手记", "10 总部", "20 财务部", "30 后勤部", "40 研发部",
             "45 教务处", "50 人事部", "60 个人档案", "90 系统"]

SUB_FOLDERS = ["10 总部/复盘", "10 总部/手机", "10 总部/日记", "10 总部/项目",
               "30 后勤部/物品", "40 研发部/知识卡", "40 研发部/灵感", "40 研发部/胡思乱想",
               "40 研发部/英语", "45 教务处/课程", "45 教务处/课件", "90 系统/views",
               "90 系统/模板", "90 系统/附件/插画", "90 系统/附件/food"]


def test_top_level_folders():
    found = sorted(p.name for p in VAULT.iterdir() if p.is_dir() and not p.name.startswith("."))
    assert found == TOP_LEVEL
    assert not (VAULT / "00 收件箱").exists()


def test_sub_folders():
    for sub in SUB_FOLDERS:
        assert (VAULT / sub).is_dir(), sub


def test_private_folders_gitignored():
    for path in ["LifeOS/60 个人档案/x.md", "LifeOS/45 教务处/课件/a.pdf"]:
        r = subprocess.run(["git", "check-ignore", "-q", path], cwd=PROJECT)
        assert r.returncode == 0, path


def _deny(path: Path) -> list[str]:
    return json.loads(path.read_text(encoding="utf-8"))["permissions"]["deny"]


def test_claude_denies_private():
    assert "Read(./LifeOS/60 个人档案/**)" in _deny(PROJECT / ".claude/settings.json")
    absolute = "Read(//Users/charlotteli/Documents/workspace/personal assistance/LifeOS/60 个人档案/**)"
    assert absolute in _deny(WORKSPACE / ".claude/settings.json")


def test_claude_md_lists_commands():
    text = (PROJECT / "CLAUDE.md").read_text(encoding="utf-8")
    for cmd in ["整理账本", "整理随手记", "整理英文", "整理课堂笔记", "生成本周复盘", "同步 Quercus"]:
        assert cmd in text, cmd
    assert "绝不读取 60 个人档案" in text


def _ignored(path: str) -> bool:
    return subprocess.run(["git", "check-ignore", "-q", path], cwd=PROJECT).returncode == 0


def test_vault_data_not_tracked():
    # 真实数据（账本、日记、随手记…）不进 git；系统文件（views、模板、附件、CSS）进 git
    for data in ["LifeOS/20 财务部/账本/2026-11.md", "LifeOS/10 总部/日记/2026-11-18.md",
                 "LifeOS/00 随手记/周末市集.md", "LifeOS/30 后勤部/食物.md"]:
        assert _ignored(data), data
    for system in ["LifeOS/90 系统/views/home/view.js", "LifeOS/90 系统/模板/日记.md",
                   "LifeOS/.obsidian/snippets/lifeos.css", "LifeOS/00 随手记/.gitkeep"]:
        assert not _ignored(system), system
    assert _ignored("LifeOS/60 个人档案/.gitkeep")
