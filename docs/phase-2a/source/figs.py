import json, datetime as dt, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt, matplotlib.dates as md
from matplotlib.patches import FancyBboxPatch
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':8.5,'axes.edgecolor':'#bdbcb6'})
d=json.load(open('plan.json')); R={r['id']:r for r in d['rows']}
C={'launch':'#eb6834','design':'#4a3aa7','identity':'#2a78d6','notif':'#1baf7a','partner':'#eda100','booking':'#e87ba4','ledger':'#008300','web':'#e34948','release':'#8a8984','pm':'#8a8984'}
LBL={'launch':'Release 2A.0 launch','design':'Discovery & design','identity':'Foundation & identity','notif':'Notifications','partner':'Partner & service','booking':'Booking & events','ledger':'Transaction ledger','web':'Web application','release':'Release, KT & warranty'}
P=lambda s: dt.datetime.strptime(s,'%Y-%m-%d')
def gantt(ids,fn,title,xmin,xmax,major,fmt,h=None,mlabels=True):
    rows=[R[i] for i in ids]; n=len(rows)
    fig,ax=plt.subplots(figsize=(11.5,h or 0.3*n+1.4),dpi=200)
    fig.patch.set_facecolor('white'); ax.set_facecolor('#fcfcfb')
    for y,r in enumerate(rows):
        s=P(r['start']); e=P(r['end'])+dt.timedelta(days=1)
        if r['type']=='M':
            ax.scatter([P(r['start'])+dt.timedelta(hours=12)],[y],marker='D',s=46,color='#0b0b0b',zorder=3,edgecolors='white',linewidths=1)
            if mlabels: ax.text(P(r['start'])+dt.timedelta(days=2.5 if (xmax-xmin).days>100 else 0.8),y,P(r['start']).strftime('%d %b'),va='center',fontsize=7.5,color='#52514e')
        else:
            ax.barh(y,(e-s).days,left=s,height=0.62,color=C[r['stream']],edgecolor='#fcfcfb',linewidth=1.2,zorder=2)
    ax.set_yticks(range(n)); ax.set_yticklabels([f"{r['id']}  {r['name'][:70]+('…' if len(r['name'])>70 else '')}" for r in rows],fontsize=7.6,color='#0b0b0b')
    ax.invert_yaxis(); ax.set_xlim(xmin,xmax)
    ax.xaxis.set_major_locator(major); ax.xaxis.set_major_formatter(md.DateFormatter(fmt))
    ax.tick_params(axis='x',labelsize=7.5,colors='#52514e'); ax.tick_params(axis='y',length=0)
    ax.grid(axis='x',color='#e6e5e0',linewidth=0.6,zorder=0)
    for sp in ['top','right']: ax.spines[sp].set_visible(False)
    L=dt.datetime(2026,10,20)
    ax.axvline(L,color='#d03b3b',linewidth=1.2,linestyle='--',zorder=1)
    ax.text(L,-0.9,' Public launch 20 Oct 2026',color='#d03b3b',fontsize=7.5,va='bottom',fontweight='bold')
    used=[]; [used.append(r['stream']) for r in rows if r['type']!='M' and r['stream'] not in used and (r['stream']!='pm' or 'release' not in used)]
    used=[u if u!='pm' else 'release' for u in used]; used=list(dict.fromkeys(used))
    from matplotlib.patches import Patch
    from matplotlib.lines import Line2D
    hd=[Patch(color=C[u],label=LBL[u]) for u in used]+[Line2D([],[],marker='D',color='#0b0b0b',linestyle='',label='Milestone / gate')]
    ax.legend(handles=hd,loc='upper center',bbox_to_anchor=(0.5,-0.06 if n>20 else -0.1),ncol=min(4 if len(hd)>6 else 5,len(hd)),frameon=False,fontsize=7.5)
    ax.set_title(title,loc='left',fontsize=10.5,fontweight='bold',color='#0b0b0b',pad=18)
    plt.tight_layout(); plt.savefig(fn,facecolor='white'); plt.close()

launch=['2.1','2.2','2.3','2.4','2.5','2.6','2.7','2.8','2.9','2.10','2.11','2.12','2.13','2.14','2.15','2.16','3.1','3.4']
gantt(launch,'gantt_launch.png','Release 2A.0 — day-level plan to the 20 October 2026 public launch',dt.datetime(2026,9,28),dt.datetime(2026,11,15),md.WeekdayLocator(byweekday=md.MO),'%d %b')
road=['2.14','2.15','3.2','3.4','3.5','3.6','3.7','3.8','3.10','4.1','4.4','4.6','5.1','5.3','5.7','5.9','9.4','6.1','6.6','6.7','7.1','7.4','7.6','7.8','8.2','8.4','8.6','10.4','11.1','11.2','11.4','11.7','12.1','12.2','12.3','12.4','12.5','12.7','13.1','13.2','13.4','13.6','13.9']
gantt(road,'gantt_roadmap.png','Phase 2A integrated roadmap — Sep 2026 to Jun 2027',dt.datetime(2026,9,21),dt.datetime(2027,6,10),md.MonthLocator(),'%b %y')

# Architecture diagram
fig,ax=plt.subplots(figsize=(11,7.2),dpi=200); ax.set_xlim(0,110); ax.set_ylim(0,72); ax.axis('off')
def box(x,y,w,h,t,fc,ec,fs=8,bold=False,tc='#0b0b0b'):
    ax.add_patch(FancyBboxPatch((x,y),w,h,boxstyle='round,pad=0.25,rounding_size=1.2',fc=fc,ec=ec,lw=1))
    ax.text(x+w/2,y+h/2,t,ha='center',va='center',fontsize=fs,fontweight='bold' if bold else 'normal',color=tc,wrap=True)
def band(y,h,t):
    ax.add_patch(FancyBboxPatch((1,y),108,h,boxstyle='round,pad=0.2,rounding_size=1.5',fc='#f4f3ef',ec='#d9d8d2',lw=0.8))
    ax.text(2.5,y+h-0.7,t,fontsize=7.8,fontweight='bold',color='#52514e',va='top')
B='#1F3864'; LB='#e8eef8'
band(60,11.5,'CLIENT CHANNELS  (separate logins, one shared identity)')
for i,t in enumerate(['User App\n(iOS / Android)','Partner App\n(iOS / Android)','Web Application\n(User, Organiser, Partner)','Admin Web Portal']):
    box(6+i*26,61.3,22,5.2,t,'white',B,7.8,True)
band(51.5,7.5,'EDGE')
box(14,52.6,90,4.2,'API Gateway / BFF — TLS · app-scoped OAuth2/OIDC tokens · rate limiting · routing · request logging','#1F3864',B,7.8,True,'white')
band(25,25,'SPORTSEEK CORE — MODULAR MONOLITH  (one deployable, strict domain boundaries, schema-per-domain)')
dom=[('Identity &\nProfile','OIDC clients, account\nlinking, roles, KYC'),('Transaction\nLedger','Read model from\ngateway data'),('Booking, Events\n& Tournaments','Cancel/refund,\nwaitlist, import'),('Partner &\nService Mgmt','Service-type registry,\nverification'),('Notification\nPlatform','Templates, routing,\npreferences')]
for i,(a,b) in enumerate(dom):
    x=6+i*19.8
    box(x,36.5,17.8,8.5,a,LB,B,8.2,True); ax.text(x+8.9,33.8,b,ha='center',va='center',fontsize=7,color='#52514e')
box(6,26.5,98,4.2,'Async event bus — transactional outbox → broker   (e.g. booking.confirmed, refund.processed, service.verified)','#dfeee8','#1baf7a',7.8,True)
band(11.8,12,'DATA & ANALYTICS')
box(6,12.8,46,6,'PostgreSQL — one instance, schema per domain\n(encrypted at rest, point-in-time backups)','white',B,7.8,True)
box(58,12.8,46,6,'Event stream → warehouse → off-the-shelf BI\n(Phase 2B — events designed in 2A)','white','#8a8984',7.8)
band(0,10.8,'SPORTSEEK-CONTRACTED THIRD PARTIES  (vendor integrates; SportSeek owns contracts)')
for i,t in enumerate(['Razorpay (payments,\nrefunds, Route)','SMS (existing)\nDLT templates','WhatsApp\nBusiness (BSP)','Push\nFCM / APNs','Email\nprovider','Maps /\nlocation']):
    box(6+i*16.5,1.2,14.5,5.2,t,'white','#eb6834',7.2)
for x in [17,43,69,95]: ax.annotate('',xy=(x,56.9),xytext=(x,61.2),arrowprops=dict(arrowstyle='->',color='#52514e',lw=0.9))
ax.annotate('',xy=(55,45.2),xytext=(55,52.5),arrowprops=dict(arrowstyle='->',color='#52514e',lw=0.9))
ax.annotate('',xy=(29,18.9),xytext=(29,26.4),arrowprops=dict(arrowstyle='<->',color='#52514e',lw=0.9))
ax.annotate('',xy=(81,18.9),xytext=(81,26.4),arrowprops=dict(arrowstyle='->',color='#8a8984',lw=0.9))
ax.annotate('',xy=(55,6.6),xytext=(55,11.7),arrowprops=dict(arrowstyle='<->',color='#52514e',lw=0.9))
ax.text(110,-1.2,'Integration adapters: retry, circuit breaker, idempotency, webhook signature checks.  Observability & secrets management span all layers.  All accounts SportSeek-owned.',fontsize=7,color='#52514e',ha='right')
plt.savefig('architecture.png',bbox_inches='tight',facecolor='white'); plt.close()

# Critical path flow
fig,ax=plt.subplots(figsize=(12,2.6),dpi=200); ax.set_xlim(0,110); ax.set_ylim(0,26); ax.axis('off')
cp=[('Contract &\naccess\n29 Sep','#8a8984'),('Discovery &\nHLD sign-off\n13 Nov','#4a3aa7'),('Design system\napproval\n20 Nov','#4a3aa7'),('Web shell &\nuser journeys\n30 Nov–22 Jan','#e34948'),('Organiser &\npartner web\n11 Jan–19 Mar','#e34948'),('Web parity &\ntesting\n8 Mar–2 Apr','#e34948'),('2A.3 SIT/\nperf/VAPT\n5–16 Apr','#8a8984'),('UAT\n19–30 Apr','#8a8984'),('Go-live\n4 May 2027','#0b0b0b')]
w=11.3
for i,(t,c) in enumerate(cp):
    x=0.5+i*12.25
    ax.add_patch(FancyBboxPatch((x,8),w,11,boxstyle='round,pad=0.2,rounding_size=1.2',fc=c,ec='white'))
    ax.text(x+w/2,13.5,t,ha='center',va='center',fontsize=6.9,color='white',fontweight='bold')
    if i: ax.annotate('',xy=(x-0.2,13.5),xytext=(x-1.7,13.5),arrowprops=dict(arrowstyle='->',color='#0b0b0b',lw=1))
ax.text(1,2.2,'Near-critical chain (about 10 working days of float): M2 Identity (to 8 Jan) → M5 Partner/Service + Razorpay Route onboarding (to 19 Feb) → M3 Ledger (to 19 Mar) → 2A.3 SIT.\nExternal gates on that chain: D10 Route confirmation (6 Nov), D18 account-merge rules (11 Dec).',fontsize=7.4,color='#52514e')
plt.savefig('critical_path.png',bbox_inches='tight',facecolor='white'); plt.close()
print('done')
