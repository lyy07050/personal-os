# 把首页 v3 + 其他页面合成一个文件：../人生OS-全部页面.html
import pathlib
here=pathlib.Path(__file__).parent
v3=(here.parent/'手绘粉绿风-v3.html').read_text(encoding='utf-8')
cut=lambda a,b,inc=True:v3[v3.index(a):v3.index(b)+(len(b) if inc else 0)]
head=v3[:v3.index('<style>')].replace('手绘粉绿风 v3 · 人生 OS','人生 OS · 全部页面')
css=cut('<style>','</style>')
svg=cut('<svg width="0" height="0"','</svg>\n\n<div class="bar">',False)+'</svg>'
tpl=cut('<template id="banner">','</template>')
main=cut('<main>','</main>')
phone=cut('<div class="phone ph">','<script>',False)
phone=phone[:phone.rindex('</div>')]  # 去掉外层 phwrap 的收尾
home=f'<section class="frame" data-page="home" data-title="首页 Home">\n<div class="app"><aside class="side"></aside>{main}</div></section>\n'
phones=f'<section class="frame phframe" data-page="phones" data-title="手机版 Mobile">\n<div class="phrow">\n{phone}\n{(here/"phones.html").read_text(encoding="utf-8")}</div></section>\n'
bar='<div class="bar"><select id="pg"></select><button id="board">Figma 平铺 / 逐页</button></div>\n'
out=(head+css+'\n<style>\n'+(here/'extra.css').read_text(encoding='utf-8')+'</style>\n</head>\n<body>\n'+svg+'\n'+tpl+'\n'+bar
     +home+(here/'pages.html').read_text(encoding='utf-8')+phones
     +'<script>\n'+(here/'app.js').read_text(encoding='utf-8')+'</script>\n</body>\n</html>\n')
(here.parent/'人生OS-全部页面.html').write_text(out,encoding='utf-8')
print('ok',len(out))
