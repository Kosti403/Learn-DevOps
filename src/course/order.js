/* Единственный источник порядка. Модуль, которого ещё нет в src/modules, просто пропускается. */
const LEVELS=[
  {id:'L1',name:'Linux-база',ids:['linux','shell','files','perms','streams','text','procs','r1','res','systemd','pkgs','bash1','bash2','pwsh','net1','r2','dns','web','ssh','fw','nginx','git','inc1']},
  {id:'L2',name:'Контейнеры',ids:['ctr','docker','dfile','multi','r3','vol','dnet','compose','registry','orch','inc2']},
  {id:'L3',name:'Kubernetes',ids:['k8sarch','k8scomp','raft','kubectl','pod','deploy','sts','probes','qos','svc','ingress','cfg','jobs','storage','helm','incident']},
  {id:'L4',name:'Доставка и инфраструктура',ids:['gitlabci','runners','vault','tf1','tfstate','tfmod','prom','grafana','bluegreen','sql','inc4']},
  {id:'L5',name:'Собес',ids:[]}];
const ORDER=LEVELS.flatMap(l=>l.ids.filter(id=>MODS[id]).map(id=>(MODS[id].lvl=MODS[id].lvl||l.id,id)));
const PASS=0.6; /* порог открытия следующего модуля */
