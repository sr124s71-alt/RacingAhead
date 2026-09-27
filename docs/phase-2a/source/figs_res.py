import json, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':8.5})
d=json.load(open('res.json')); M=d['months']
order=['mgmt','design','backend','mobile','web','qa','ops','spec']
col=['#2a78d6','#eb6834','#1baf7a','#eda100','#e87ba4','#008300','#4a3aa7','#e34948']
fig,ax=plt.subplots(figsize=(10,4.4),dpi=200); ax.set_facecolor('#fcfcfb')
base=[0]*len(M)
for g,c in zip(order,col):
    v=[sum(r['load'][i] for r in d['roles'] if r['group']==g) for i in range(len(M))]
    ax.bar(M,v,bottom=base,color=c,width=0.62,edgecolor='#fcfcfb',linewidth=1.5,label=d['groups'][g],zorder=2)
    base=[a+b for a,b in zip(base,v)]
for i,t in enumerate(d['total']): ax.text(i,t+0.4,f'{t:g}',ha='center',fontsize=8,color='#0b0b0b',fontweight='bold')
ax.set_ylabel('Srivin FTE (monthly average)',color='#52514e'); ax.set_ylim(0,28)
ax.grid(axis='y',color='#e6e5e0',linewidth=0.6,zorder=0)
for s in ['top','right']: ax.spines[s].set_visible(False)
ax.tick_params(colors='#52514e')
ax.legend(loc='upper center',bbox_to_anchor=(0.5,-0.1),ncol=4,frameon=False,fontsize=7.8)
ax.set_title('Srivin resource loading by skill group — Oct 2026 to Jun 2027 (154 person-months)',loc='left',fontsize=10,fontweight='bold',pad=10)
ax.text(0,26.3,'Launch\n2A.0',ha='center',fontsize=7,color='#52514e'); ax.text(3,26.3,'Peak build\n(4 squads)',ha='center',fontsize=7,color='#52514e'); ax.text(7,26.3,'2A.3 go-live,\nhypercare & KT',ha='center',fontsize=7,color='#52514e')
plt.tight_layout(); plt.savefig('resource_histogram.png',facecolor='white'); print('ok')
