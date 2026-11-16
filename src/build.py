import base64,re,sys,os
d=os.path.dirname(os.path.abspath(__file__))
s=open(os.path.join(d,'deal.src.html')).read()
def rep(m):
    b=base64.b64encode(open(os.path.join(d,'img',m.group(1)+'.jpg'),'rb').read()).decode()
    return 'data:image/jpeg;base64,'+b
s=re.sub(r'\{\{IMG:([\w-]+)\}\}',rep,s)
open(os.path.join(d,'..','deal-view.html'),'w').write(s)
print(len(s))
