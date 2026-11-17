"""Generate complete PDF snapshots from published report HTML and unchanged radar.js.
Requirements: Python weasyprint/lxml/pypdf, Node, Noto Sans CJK TC fonts.
Run from repository root: python build-pdfs.py. Regenerate after report/data changes.
"""
import json,pathlib,hashlib,datetime,subprocess,html
from lxml import html as lh
from weasyprint import HTML,CSS
from pypdf import PdfReader,PdfWriter
ROOT=pathlib.Path(__file__).resolve().parent
OUT=ROOT/'pdf';OUT.mkdir(exist_ok=True)
subprocess.run(['node','render-radar.cjs'],cwd=ROOT,check=True)
radars=json.loads((ROOT/'radar-print.json').read_text())
scores=json.loads((ROOT/'scores.json').read_text()); names=list(dict.fromkeys(r[0] for r in scores))
base='https://rosawish.github.io/hyec-performance-dashboard/'
manifest={'source_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'generated_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reports':[]}
for name in ['全公司總覽']+names:
 source=ROOT/('index.html' if name=='全公司總覽' else f'reports/{name}.html')
 tree=lh.fromstring(source.read_text()); main=tree.xpath('//main')[0]
 if name=='全公司總覽':
  rows=tree.get_element_by_id('rows')
  def score(v,single=False):
   a=v.split('/');return '/'.join(f'{float(n):.2f}' for n in (a[:1] if single else a))
  for r in scores:
   rows.append(lh.fromstring('<tr><td>'+html.escape(r[0]+'｜'+r[1])+'</td>'+''.join('<td>'+score(r[i],i==3)+'</td>' for i in [3,4,5])+'<td>見本合集個人完整報告</td></tr>'))
  tree.get_element_by_id('reportlinks').text='本全公司完整 PDF 合集後續章節包含全部 13 位主管個人報告，謝世澤雙角色併列於個人章節。'
 for e in list(main.xpath('.//script | .//*[contains(@class,"pdf-downloads")] | .//label | .//input')):e.getparent().remove(e)
 panel=main.xpath('.//*[@id="radar-panel"]')[0];panel.getparent().remove(panel); main.append(panel)
 for item in radars[name]:main.append(lh.fromstring('<section class="radar-snapshot"><h2>'+item['title']+' 雷達比較</h2>'+item['html']+'</section>'))
 for e in main.xpath('.//details'):e.set('open','open')
 for a in main.xpath('.//a[@href]'):
  from urllib.parse import urljoin
  a.set('href',urljoin(base+('' if name=='全公司總覽' else 'reports/'),a.get('href')))
 cover=lh.fromstring('<div class="pdf-cover"><strong>宏于電機｜2026 年第三季績效試評完整報告</strong><p>範圍：'+name+'｜資料：現行網站快照｜情境試算與發展建議，非正式核定成績。<br>全公司指本戰情室所列經營團隊，不代表公司全體員工。外部原始文件及歷史版本保留連結，不內嵌附件。</p></div>');main.insert(0,cover)
 content='<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>'+name+'｜Q3績效完整報告</title><body>'+lh.tostring(main,encoding='unicode')+'</body></html>'
 path=OUT/(name+'_2026Q3完整報告.pdf')
 HTML(string=content,base_url=str(ROOT)).write_pdf(path,stylesheets=[CSS(filename=str(ROOT/'pdf-print.css'))])
 reader=PdfReader(path); text=''.join(p.extract_text() or '' for p in reader.pages)
 assert name in text and len(text)>3000,(name,len(text))
 manifest['reports'].append({'name':name,'file':path.name,'pages':len(reader.pages),'characters':len(text),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
 print(name,len(reader.pages),len(text),flush=True)
writer=PdfWriter()
for item in manifest['reports']:writer.append(str(OUT/item['file']),outline_item=item['name'])
combined=OUT/'全公司_2026Q3完整報告.pdf';writer.write(combined)
manifest['combined']={'file':combined.name,'pages':len(PdfReader(combined).pages),'sha256':hashlib.sha256(combined.read_bytes()).hexdigest()}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
(ROOT/'radar-print.json').unlink()
