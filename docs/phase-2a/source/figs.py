import json, datetime as dt, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt, matplotlib.dates as md
from matplotlib.patches import FancyBboxPatch
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':8.5,'axes.edgecolor':'#bdbcb6'})
d=json.load(open('plan.json')); R={r['id']:r for r in d['rows']}
C={'launch':'#eb6834','design':'#4a3aa7','identity':'#2a78d6','notif':'#1baf7a','partner':'#eda100','booking':'#e87ba4','ledger':'#008300','web':'#e34948','release':'#8a8984','pm':'#8a8984'}
LBL={'launch':'R1 launch','design':'Discovery & design','identity':'Foundation & identity','notif':'Notifications','partner':'Partner & service','booking':'Booking & events','ledger':'Transaction ledger','web':'Web application','release':'Release, KT & warranty'}
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

launch=['2.1','2.2','2.3','2.4','2.5','2.6','2.7','2.8','2.9','2.10','2.11','2.12','2.13','2.14','2.15','2.16','2.17','2.18','2.19','2.20','3.2','3.3','3.5']
gantt(launch,'gantt_launch.png','Release R1 — day-level plan to the 20 Oct 2026 launch, incl. F3 Shared Identity',dt.datetime(2026,9,28),dt.datetime(2026,11,9),md.WeekdayLocator(byweekday=md.MO),'%d %b')
road=['2.6','2.7','2.8','2.19','2.20','3.2','3.3','3.4','3.5','3.7','4.1','4.3','4.4','5.1','5.2','5.3','5.4','5.5','5.6','6.1','6.2','6.3','6.4','7.1','7.2','7.3','7.4','8.1','8.2','8.3','8.4','9.1','9.2','9.3','9.4','9.5','9.7','9.9']
gantt(road,'gantt_roadmap.png','Phase 2A monthly release train — Oct 2026 to Apr 2027',dt.datetime(2026,9,28),dt.datetime(2027,4,12),md.MonthLocator(),'%b %y')

# Release train figure
fig,ax=plt.subplots(figsize=(11.5,3.9),dpi=200); ax.set_xlim(0,120); ax.set_ylim(0,40); ax.axis('off')
rel=[('R1','20 Oct 2026','Public launch','F3 Shared identity & account linking','Hardened, security- and load-tested Phase 1','#eb6834'),
     ('R2','24 Nov 2026','','F1 Email + F2 Reminders','F4 Push notifications & preferences','#2a78d6'),
     ('R3','22 Dec 2026','','F5 Cancellation & refunds','F6 Web app — players','#e87ba4'),
     ('R4','27 Jan 2027','','F7 Partner model: coach, physio, nutritionist','F8 Waitlist & edit alerts','#eda100'),
     ('R5','23 Feb 2027','','F9 Transaction Ledger','F10 Web app — organisers & partners','#008300'),
     ('R6','23 Mar 2027','Phase 2A complete','F11 Split settlement & partner payouts','F12 WhatsApp & full alert catalog','#4a3aa7')]
ax.plot([2,118],[30,30],color='#bdbcb6',lw=2,zorder=1)
for i,(r,d,tag,f1,f2,c) in enumerate(rel):
    x=2+i*19.6
    ax.scatter([x+8.6],[30],s=160,color=c,zorder=3,edgecolors='white',linewidths=1.5)
    ax.text(x+8.6,35.6,r,ha='center',fontsize=11,fontweight='bold',color='#0b0b0b')
    ax.text(x+8.6,33,d,ha='center',fontsize=8,color='#52514e')
    ax.add_patch(FancyBboxPatch((x,6),17.2,19,boxstyle='round,pad=0.3,rounding_size=1.2',fc='white',ec=c,lw=1.4))
    ax.add_patch(FancyBboxPatch((x,22.2),17.2,2.8,boxstyle='square,pad=0',fc=c,ec=c))
    ax.text(x+8.6,23.6,tag or 'Monthly release',ha='center',va='center',fontsize=7.2,color='white',fontweight='bold')
    import textwrap
    ax.text(x+1,19.5,'\n'.join(textwrap.wrap(f1,21)),fontsize=7.4,va='top',color='#0b0b0b')
    ax.text(x+1,12.2,'\n'.join(textwrap.wrap(f2,21)),fontsize=7.4,va='top',color='#0b0b0b')
ax.text(2,1.5,'Fixed dates, flexible scope: a feature that is not release-ready rides the next train behind a feature flag. F3 ships in R1 behind a remote switch with fallback to Phase 1 login.',fontsize=7.8,color='#52514e')
plt.savefig('release_train.png',bbox_inches='tight',facecolor='white'); plt.close()

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
cp=[('Access &\nAI approval\n29 Sep','#8a8984'),('Identity\ndecisions\n2 Oct','#4a3aa7'),('R1 launch +\nF3 Identity\n20 Oct','#eb6834'),('R2 Notifications\n+ merge\n24 Nov','#2a78d6'),('R3 Refunds\n+ Web v1\n22 Dec','#e87ba4'),('R4 Partner\nmodel\n27 Jan','#eda100'),('R5 Ledger\n+ Web v2\n23 Feb','#008300'),('R6 Route +\nWhatsApp\n23 Mar','#4a3aa7'),('Phase 2A\naccepted\n2 Apr 2027','#0b0b0b')]
w=11.3
for i,(t,c) in enumerate(cp):
    x=0.5+i*12.25
    ax.add_patch(FancyBboxPatch((x,8),w,11,boxstyle='round,pad=0.2,rounding_size=1.2',fc=c,ec='white'))
    ax.text(x+w/2,13.5,t,ha='center',va='center',fontsize=6.9,color='white',fontweight='bold')
    if i: ax.annotate('',xy=(x-0.2,13.5),xytext=(x-1.7,13.5),arrowprops=dict(arrowstyle='->',color='#0b0b0b',lw=1))
ax.text(1,2.2,'Each release builds on the one before: identity → notifications and merge → refunds → partner model → ledger → payouts. External gates on the path: D21 AI approval (29 Sep),\nD22 identity decisions (2 Oct), D18 merge rules (30 Oct), D10 Route confirmation (6 Nov), D11 refund policy (13 Nov), D13 WhatsApp templates (5 Feb).',fontsize=7.4,color='#52514e')
plt.savefig('critical_path.png',bbox_inches='tight',facecolor='white'); plt.close()
print('done')
