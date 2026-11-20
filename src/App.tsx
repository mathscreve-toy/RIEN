import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  Bell, CalendarDays, CalendarRange, ChevronRight, Download, Eye, EyeOff, KeyRound,
  LifeBuoy, LogOut, MapPinned, Menu, Plus, RefreshCw, Search,
  ShieldCheck, SlidersHorizontal, Users, Waves, X,
} from 'lucide-react'
import { supabase } from './supabase'

type Role = 'admin' | 'chief' | 'assistant' | 'crew'
type View = 'dashboard' | 'sectors' | 'team' | 'availability' | 'planning' | 'settings'

type Profile = {
  user_id: string
  email: string
  display_name: string | null
  phone: string | null
  role: Role
  must_set_password: boolean
}

type Sector = { id: string; name: string; description: string | null }
type Beach = {
  id: string
  sector_id: string
  name: string
  location: string | null
  weekday_required_crew: number
  weekend_required_crew: number
  chief_positions: number
}
type StaffingPeriod = {
  id: string
  beach_id: string
  label: string | null
  start_on: string
  end_on: string
  required_crew: number
  chief_positions: number
}

const roleLabels: Record<Role, string> = {
  admin: 'Administrateur', chief: 'Chef de secteur', assistant: 'Adjoint', crew: 'Équipier',
}

const nav: { id: View; label: string; icon: typeof Waves }[] = [
  { id: 'dashboard', label: 'Accueil', icon: Waves },
  { id: 'sectors', label: 'Secteurs', icon: MapPinned },
  { id: 'team', label: 'Équipe', icon: Users },
  { id: 'availability', label: 'Disponibilités', icon: CalendarDays },
  { id: 'planning', label: 'Planning', icon: ShieldCheck },
  { id: 'settings', label: 'Réglages', icon: SlidersHorizontal },
]

function isSdisEmail(email: string) {
  return /^[^\s@]+@sdis76\.fr$/i.test(email.trim())
}

function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'first' | 'forgot'>('login')
  const [email, setEmail] = useState(() => localStorage.getItem('vigi-email') || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(() => Boolean(localStorage.getItem('vigi-email')))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null); setMessage(null)
    const cleanEmail = email.trim().toLowerCase()
    if (!isSdisEmail(cleanEmail)) {
      setError('Utilisez uniquement votre adresse professionnelle @sdis76.fr.')
      return
    }
    setBusy(true)
    try {
      if (remember) localStorage.setItem('vigi-email', cleanEmail)
      else localStorage.removeItem('vigi-email')

      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        if (authError) throw authError
      } else if (mode === 'first') {
        const { error: authError } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
        })
        if (authError) throw authError
        setMessage('Un lien sécurisé vient d’être envoyé. Ouvrez votre messagerie SDIS 76 pour définir votre mot de passe.')
      } else {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/?mode=recovery`,
        })
        if (authError) throw authError
        setMessage('Le lien de réinitialisation a été envoyé sur votre messagerie professionnelle.')
      }
    } catch (authError) {
      const text = authError instanceof Error ? authError.message : 'Connexion impossible.'
      setError(text.includes('Invalid login') ? 'Identifiant ou mot de passe incorrect.' : text)
    } finally { setBusy(false) }
  }

  return <main className="auth-page">
    <section className="auth-brand">
      <img src="/vigi-logo.png" alt="Logo Vigi" />
      <span>VIGI</span><strong>SECTOR</strong>
      <p>Organisation sécurisée des plages et des équipes du SDIS 76.</p>
      <div className="auth-trust"><ShieldCheck size={18}/><span>Accès réservé aux adresses <b>@sdis76.fr</b></span></div>
    </section>
    <section className="auth-card">
      <div className="auth-kicker"><i/> CONNEXION SÉCURISÉE</div>
      <h1>{mode === 'login' ? 'Bienvenue.' : mode === 'first' ? 'Première connexion.' : 'Mot de passe oublié.'}</h1>
      <p>{mode === 'login' ? 'Retrouvez votre secteur et vos prochaines actions.' : mode === 'first' ? 'Un lien sécurisé vous permettra de choisir votre mot de passe.' : 'Recevez un lien pour créer un nouveau mot de passe.'}</p>
      <form onSubmit={submit}>
        <label><span>ADRESSE PROFESSIONNELLE</span><div className="field"><Users size={18}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="prenom.nom@sdis76.fr" autoComplete="username" required/></div></label>
        {mode === 'login' && <label><span>MOT DE PASSE</span><div className="field"><KeyRound size={18}/><input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Votre mot de passe" autoComplete="current-password" required/><button type="button" className="eye" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Masquer le mot de passe':'Afficher le mot de passe'}>{showPassword?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></label>}
        <label className="remember"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/><span><b>Connexion rapide sur cet appareil</b><small>Votre navigateur ou votre trousseau peut enregistrer le mot de passe de façon sécurisée.</small></span></label>
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-message">{message}</div>}
        <button className="primary" disabled={busy}>{busy?<RefreshCw className="spin" size={18}/>:mode==='login'?<KeyRound size={18}/>:<LifeBuoy size={18}/>} {busy?'Patientez…':mode==='login'?'Se connecter':mode==='first'?'Recevoir mon lien':'Réinitialiser'}</button>
      </form>
      <div className="auth-links">
        {mode !== 'first' && <button onClick={()=>{setMode('first');setError(null);setMessage(null)}}>Première connexion</button>}
        {mode !== 'forgot' && <button onClick={()=>{setMode('forgot');setError(null);setMessage(null)}}>Mot de passe oublié</button>}
        {mode !== 'login' && <button onClick={()=>{setMode('login');setError(null);setMessage(null)}}>Retour à la connexion</button>}
      </div>
    </section>
  </main>
}

function PasswordSetup({profile, onComplete}:{profile:Profile;onComplete:()=>void}) {
  const [password,setPassword]=useState('')
  const [confirm,setConfirm]=useState('')
  const [show,setShow]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState<string|null>(null)
  async function submit(e:FormEvent){
    e.preventDefault();setError(null)
    if(password.length<10){setError('Choisissez au moins 10 caractères.');return}
    if(password!==confirm){setError('Les deux mots de passe sont différents.');return}
    setBusy(true)
    const {error:authError}=await supabase.auth.updateUser({password})
    if(authError){setError(authError.message);setBusy(false);return}
    const {error:profileError}=await supabase.from('profiles').update({must_set_password:false}).eq('user_id',profile.user_id)
    if(profileError){setError(profileError.message);setBusy(false);return}
    onComplete()
  }
  return <main className="setup-page"><section className="setup-card"><img src="/vigi-logo.png" alt="Vigi"/><span>PREMIÈRE CONNEXION</span><h1>Définissez votre mot de passe</h1><p>Il sera chiffré et géré par Supabase. Vigi Sector ne peut jamais le lire.</p><form onSubmit={submit}><label><span>NOUVEAU MOT DE PASSE</span><div className="field"><KeyRound size={18}/><input type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password"/><button type="button" className="eye" onClick={()=>setShow(v=>!v)}>{show?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></label><label><span>CONFIRMER</span><div className="field"><ShieldCheck size={18}/><input type={show?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password"/></div></label>{error&&<div className="auth-error">{error}</div>}<button className="primary" disabled={busy}>{busy?'Enregistrement…':'Enregistrer et accéder à Vigi'}</button></form></section></main>
}

function EmptyState({icon:Icon,title,text,action}:{icon:typeof Waves;title:string;text:string;action?:React.ReactNode}){
  return <section className="empty-state"><span><Icon size={30}/></span><h2>{title}</h2><p>{text}</p>{action}</section>
}

function AppShell({session,profile,onProfileRefresh}:{session:Session;profile:Profile;onProfileRefresh:()=>void}){
  const [view,setView]=useState<View>('dashboard')
  const [mobileMenu,setMobileMenu]=useState(false)
  const [sectors,setSectors]=useState<Sector[]>([])
  const [beaches,setBeaches]=useState<Beach[]>([])
  const [staffingPeriods,setStaffingPeriods]=useState<StaffingPeriod[]>([])
  const [profiles,setProfiles]=useState<Profile[]>([])
  const [campaignCount,setCampaignCount]=useState(0)
  const [assignmentCount,setAssignmentCount]=useState(0)
  const [loading,setLoading]=useState(true)
  const [toast,setToast]=useState<string|null>(null)
  const [createSector,setCreateSector]=useState(false)
  const [createBeach,setCreateBeach]=useState(false)
  const [periodBeach,setPeriodBeach]=useState<Beach|null>(null)
  const [search,setSearch]=useState('')
  const [viewRole,setViewRole]=useState<Role>(()=>profile.role==='admin'&&sessionStorage.getItem('vigi-view-role')==='chief'?'chief':profile.role)

  const effectiveRole=profile.role==='admin'?viewRole:profile.role
  const canCreateSector=profile.role==='admin'&&effectiveRole==='admin'
  const canManageBeaches=['admin','chief','assistant'].includes(effectiveRole)
  const notify=useCallback((text:string)=>{setToast(text);window.setTimeout(()=>setToast(null),2800)},[])
  const switchRole=(role:'admin'|'chief')=>{setViewRole(role);sessionStorage.setItem('vigi-view-role',role);setView('dashboard');notify(`Mode ${roleLabels[role]} activé`)}
  const formatDate=(value:string)=>new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${value}T12:00:00`))

  const loadData=useCallback(async()=>{
    setLoading(true)
    const [sectorRes,beachRes,periodRes,profileRes,campaignRes,assignmentRes]=await Promise.all([
      supabase.from('sectors').select('id,name,description').order('name'),
      supabase.from('beaches').select('id,sector_id,name,location,weekday_required_crew,weekend_required_crew,chief_positions').order('name'),
      supabase.from('staffing_periods').select('id,beach_id,label,start_on,end_on,required_crew,chief_positions').order('start_on'),
      supabase.from('profiles').select('user_id,email,display_name,phone,role,must_set_password').order('display_name'),
      supabase.from('campaigns').select('*',{count:'exact',head:true}),
      supabase.from('assignments').select('*',{count:'exact',head:true}),
    ])
    setSectors((sectorRes.data||[]) as Sector[])
    setBeaches((beachRes.data||[]) as Beach[])
    setStaffingPeriods((periodRes.data||[]) as StaffingPeriod[])
    setProfiles((profileRes.data||[]) as Profile[])
    setCampaignCount(campaignRes.count||0)
    setAssignmentCount(assignmentRes.count||0)
    setLoading(false)
  },[])
  useEffect(()=>{void loadData()},[loadData])

  const filteredProfiles=useMemo(()=>profiles.filter(p=>(p.display_name||p.email).toLowerCase().includes(search.toLowerCase())),[profiles,search])

  async function addSector(name:string,description:string){
    const {error}=await supabase.from('sectors').insert({name,description:description||null,created_by:session.user.id})
    if(error) throw error
    setCreateSector(false);notify('Secteur créé');await loadData()
  }
  async function addBeach(sectorId:string,name:string,location:string,weekday:number,weekend:number){
    const {error}=await supabase.from('beaches').insert({sector_id:sectorId,name,location:location||null,weekday_required_crew:weekday,weekend_required_crew:weekend,chief_positions:1})
    if(error) throw error
    setCreateBeach(false);notify('Plage et effectifs créés');await loadData()
  }
  async function addStaffingPeriod(beachId:string,label:string,startOn:string,endOn:string,required:number){
    const {error}=await supabase.from('staffing_periods').insert({beach_id:beachId,label:label||null,start_on:startOn,end_on:endOn,required_crew:required,chief_positions:1})
    if(error) throw error
    setPeriodBeach(null);notify('Effectif de période créé');await loadData()
  }
  async function exportAvailability(){
    const {data,error}=await supabase.from('availabilities').select('available_on,status,comment,submitted_at,profiles(email,display_name),campaigns(title)')
    if(error){notify('Export impossible');return}
    const rows=[['Nom','Adresse','Campagne','Date','Disponibilité','Commentaire','Transmission'],...(data||[]).map((row:any)=>[row.profiles?.display_name||'',row.profiles?.email||'',row.campaigns?.title||'',row.available_on,row.status,row.comment||'',row.submitted_at])]
    const csv='\uFEFF'+rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(';')).join('\n')
    const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));link.download='recensement-disponibilites-vigi-sector.csv';link.click();URL.revokeObjectURL(link.href);notify('Extraction Excel téléchargée')
  }

  function content(){
    if(loading)return <div className="loading"><RefreshCw className="spin"/> Chargement sécurisé…</div>
    if(view==='dashboard')return <>
      <PageTitle eyebrow="TABLEAU DE BORD" title={`Bonjour ${profile.display_name||profile.email.split('@')[0]}.`} text={`Vous consultez Vigi Sector en mode ${roleLabels[effectiveRole]}.`} action={profile.role==='admin'?<RoleSwitch value={effectiveRole as 'admin'|'chief'} onChange={switchRole}/>:undefined}/>
      <section className="metrics"><article><span><MapPinned/></span><strong>{sectors.length}</strong><small>secteur{sectors.length>1?'s':''}</small></article><article><span><Waves/></span><strong>{beaches.length}</strong><small>plage{beaches.length>1?'s':''}</small></article><article><span><Users/></span><strong>{profiles.length}</strong><small>profil{profiles.length>1?'s':''}</small></article><article><span><CalendarDays/></span><strong>{campaignCount}</strong><small>campagne{campaignCount>1?'s':''}</small></article></section>
      {sectors.length===0&&<EmptyState icon={MapPinned} title="Commencez par créer un secteur" text="Ajoutez votre premier secteur, puis ses plages et ses équipiers." action={canCreateSector?<button className="primary compact" onClick={()=>setCreateSector(true)}><Plus size={17}/> Créer le premier secteur</button>:undefined}/>} 
    </>
    if(view==='sectors')return <>
      <PageTitle eyebrow="ORGANISATION" title="Secteurs et plages" text="Définissez les effectifs de semaine, de week-end et les périodes particulières." action={(canCreateSector||canManageBeaches)?<div className="page-actions">{canCreateSector&&<button onClick={()=>setCreateSector(true)}><Plus size={17}/> Secteur</button>}{canManageBeaches&&<button className="primary" onClick={()=>setCreateBeach(true)} disabled={!sectors.length}><Plus size={17}/> Plage</button>}</div>:undefined}/>
      {sectors.length===0?<EmptyState icon={MapPinned} title="Aucun secteur" text="Basculez en mode Administrateur pour créer le premier secteur."/>:<section className="sector-grid">{sectors.map(s=><article key={s.id}><header><span>{s.name.slice(0,1).toUpperCase()}</span><div><h3>{s.name}</h3><p>{s.description||'Aucune description'}</p></div></header><div className="beach-list">{beaches.filter(b=>b.sector_id===s.id).map(b=>{
        const periods=staffingPeriods.filter(p=>p.beach_id===b.id)
        return <div className="beach-item" key={b.id}><div className="beach-title"><Waves size={20}/><span><b>{b.name}</b><small>{b.location||'Localisation à compléter'}</small></span></div><div className="staffing-grid"><span><small>LUNDI–VENDREDI</small><b>{b.weekday_required_crew} équipier{b.weekday_required_crew>1?'s':''} + {b.chief_positions} chef de poste</b></span><span><small>SAMEDI–DIMANCHE</small><b>{b.weekend_required_crew} équipier{b.weekend_required_crew>1?'s':''} + {b.chief_positions} chef de poste</b></span></div>{periods.length>0&&<div className="period-list">{periods.map(p=><span key={p.id}><CalendarRange size={16}/><b>{p.label||'Période spécifique'}</b><small>{formatDate(p.start_on)} → {formatDate(p.end_on)} · {p.required_crew} équipier{p.required_crew>1?'s':''} + {p.chief_positions} chef de poste</small></span>)}</div>}{canManageBeaches&&<button className="period-add" onClick={()=>setPeriodBeach(b)}><Plus size={15}/> Effectif sur une période</button>}</div>
      })}{!beaches.some(b=>b.sector_id===s.id)&&<p className="muted">Aucune plage créée</p>}</div></article>)}</section>}
    </>
    if(view==='team')return <><PageTitle eyebrow="ÉQUIPE" title={`${profiles.length} profil${profiles.length>1?'s':''}`} text="Comptes vérifiés et rattachés au domaine SDIS 76." action={<button className="primary" onClick={exportAvailability}><Download size={17}/> Exporter les disponibilités</button>}/><div className="toolbar"><label><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un profil…"/></label></div><section className="team-grid">{filteredProfiles.map(p=><article key={p.user_id}><span className="avatar">{(p.display_name||p.email).split(/[ .@]/).slice(0,2).map(x=>x[0]).join('').toUpperCase()}</span><div><h3>{p.display_name||'Profil à compléter'}</h3><p>{p.email}</p><small>{roleLabels[p.role]}</small></div><i>{p.must_set_password?'Première connexion':'Actif'}</i></article>)}</section></>
    if(view==='availability')return <><PageTitle eyebrow="RECENSEMENT" title="Disponibilités" text="Les non-saisies seront considérées comme indisponibles."/><EmptyState icon={CalendarDays} title="Aucune campagne ouverte" text="Le chef de secteur pourra créer une campagne dès qu’un secteur sera configuré."/></>
    if(view==='planning')return <><PageTitle eyebrow="AFFECTATIONS" title="Planning des plages" text="Chaque plage prévoit un chef de poste et les équipiers requis selon le jour ou la période."/><EmptyState icon={ShieldCheck} title="Aucune affectation" text={`${assignmentCount} affectation enregistrée. Créez d’abord les secteurs, les plages et une campagne.`}/></>
    return <><PageTitle eyebrow="SÉCURITÉ" title="Mon profil" text="Les sessions restent indépendantes sur chaque appareil."/><section className="settings-card"><div><span><Users/></span><p><b>{profile.display_name||'Nom à compléter'}</b><small>{profile.email} · {roleLabels[profile.role]}</small></p></div>{profile.role==='admin'&&<section className="role-panel"><div><b>Profil d’utilisation</b><small>Vos droits administrateur restent actifs pendant la bascule.</small></div><RoleSwitch value={effectiveRole as 'admin'|'chief'} onChange={switchRole}/></section>}<ProfileName profile={profile} onSaved={()=>{onProfileRefresh();loadData();notify('Profil mis à jour')}}/><div className="security-note"><ShieldCheck/><p><b>Multi-connexion active</b><small>Vous pouvez rester connecté simultanément sur votre téléphone, votre tablette et votre ordinateur. La déconnexion ci-dessous concerne uniquement cet appareil.</small></p></div><button className="logout" onClick={()=>supabase.auth.signOut({scope:'local'})}><LogOut size={17}/> Se déconnecter de cet appareil</button></section></>
  }

  return <div className="app-shell">
    <div className="ambient one"/><div className="ambient two"/>
    <header><button className="brand" onClick={()=>setView('dashboard')}><img src="/vigi-logo.png" alt=""/><span><b>VIGI</b><small>SECTOR</small></span></button><div className="header-status"><i/><span><small>ENVIRONNEMENT SÉCURISÉ</small><b>{sectors[0]?.name||'Configuration initiale'}</b></span></div><div className="header-user"><span className="avatar small">{(profile.display_name||profile.email)[0].toUpperCase()}</span><div><small>{roleLabels[effectiveRole]}</small><b>{profile.display_name||profile.email}</b></div><button onClick={()=>setMobileMenu(v=>!v)}><Menu/></button></div></header>
    <aside className={mobileMenu?'open':''}><div className="aside-head"><span>NAVIGATION</span><button onClick={()=>setMobileMenu(false)}><X/></button></div>{nav.map(item=><button key={item.id} className={view===item.id?'active':''} onClick={()=>{setView(item.id);setMobileMenu(false)}}><item.icon/><span>{item.label}</span></button>)}<div className="aside-footer"><ShieldCheck/><span><b>{roleLabels[effectiveRole]}</b><small>Droits sécurisés</small></span></div></aside>
    {mobileMenu&&<button className="backdrop" onClick={()=>setMobileMenu(false)} aria-label="Fermer le menu"/>}
    <main className="workspace">{content()}</main>
    <nav className="mobile-dock">{nav.slice(0,5).map(item=><button key={item.id} className={view===item.id?'active':''} onClick={()=>setView(item.id)}><item.icon/><small>{item.label}</small></button>)}</nav>
    {createSector&&<SectorModal close={()=>setCreateSector(false)} submit={addSector}/>} 
    {createBeach&&<BeachModal sectors={sectors} close={()=>setCreateBeach(false)} submit={addBeach}/>} 
    {periodBeach&&<StaffingPeriodModal beach={periodBeach} close={()=>setPeriodBeach(null)} submit={addStaffingPeriod}/>} 
    {toast&&<div className="toast"><ShieldCheck size={18}/>{toast}</div>}
  </div>
}

function PageTitle({eyebrow,title,text,action}:{eyebrow:string;title:string;text:string;action?:React.ReactNode}){return <div className="page-title"><div><span>{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>{action}</div>}

function SectorModal({close,submit}:{close:()=>void;submit:(name:string,description:string)=>Promise<void>}){const[name,setName]=useState('');const[description,setDescription]=useState('');const[error,setError]=useState<string|null>(null);const[busy,setBusy]=useState(false);return <div className="modal-layer" onMouseDown={e=>e.target===e.currentTarget&&close()}><form className="modal" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await submit(name,description)}catch(x){setError(x instanceof Error?x.message:'Erreur')}finally{setBusy(false)}}}><header><div><span>NOUVEAU SECTEUR</span><h2>Créer un secteur</h2></div><button type="button" onClick={close}><X/></button></header><label><span>NOM</span><input value={name} onChange={e=>setName(e.target.value)} required placeholder="Ex. Littoral Ouest"/></label><label><span>DESCRIPTION</span><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Périmètre et communes concernées"/></label>{error&&<div className="auth-error">{error}</div>}<button className="primary" disabled={busy}>{busy?'Création…':'Créer le secteur'}</button></form></div>}

function BeachModal({sectors,close,submit}:{sectors:Sector[];close:()=>void;submit:(sectorId:string,name:string,location:string,weekday:number,weekend:number)=>Promise<void>}){
  const[sector,setSector]=useState(sectors[0]?.id||'')
  const[name,setName]=useState('')
  const[location,setLocation]=useState('')
  const[weekday,setWeekday]=useState(2)
  const[weekend,setWeekend]=useState(2)
  const[error,setError]=useState<string|null>(null)
  const[busy,setBusy]=useState(false)
  return <div className="modal-layer" onMouseDown={e=>e.target===e.currentTarget&&close()}><form className="modal" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await submit(sector,name,location,weekday,weekend)}catch(x){setError(x instanceof Error?x.message:'Erreur')}finally{setBusy(false)}}}><header><div><span>NOUVELLE PLAGE</span><h2>Créer une plage</h2></div><button type="button" onClick={close}><X/></button></header><label><span>SECTEUR</span><select value={sector} onChange={e=>setSector(e.target.value)}>{sectors.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label><span>NOM DE LA PLAGE</span><input value={name} onChange={e=>setName(e.target.value)} required/></label><label><span>LOCALISATION</span><input value={location} onChange={e=>setLocation(e.target.value)}/></label><div className="chief-fixed"><ShieldCheck size={19}/><span><b>1 chef de poste</b><small>Obligatoire pour chaque ouverture de plage</small></span></div><div className="form-row"><label><span>ÉQUIPIERS · LUNDI–VENDREDI</span><select value={weekday} onChange={e=>setWeekday(Number(e.target.value))}>{[1,2,3].map(n=><option key={n}>{n}</option>)}</select></label><label><span>ÉQUIPIERS · SAMEDI–DIMANCHE</span><select value={weekend} onChange={e=>setWeekend(Number(e.target.value))}>{[1,2,3].map(n=><option key={n}>{n}</option>)}</select></label></div>{error&&<div className="auth-error">{error}</div>}<button className="primary" disabled={busy}>{busy?'Création…':'Créer la plage et ses effectifs'}</button></form></div>
}

function StaffingPeriodModal({beach,close,submit}:{beach:Beach;close:()=>void;submit:(beachId:string,label:string,startOn:string,endOn:string,required:number)=>Promise<void>}){
  const[label,setLabel]=useState('')
  const[startOn,setStartOn]=useState('')
  const[endOn,setEndOn]=useState('')
  const[required,setRequired]=useState(2)
  const[error,setError]=useState<string|null>(null)
  const[busy,setBusy]=useState(false)
  return <div className="modal-layer" onMouseDown={e=>e.target===e.currentTarget&&close()}><form className="modal" onSubmit={async e=>{e.preventDefault();setError(null);if(endOn<startOn){setError('La date de fin doit être postérieure à la date de début.');return}setBusy(true);try{await submit(beach.id,label,startOn,endOn,required)}catch(x){setError(x instanceof Error?x.message:'Erreur')}finally{setBusy(false)}}}><header><div><span>EFFECTIF TEMPORAIRE</span><h2>{beach.name}</h2></div><button type="button" onClick={close}><X/></button></header><p className="modal-intro">Cet effectif remplace les valeurs habituelles pendant toute la période choisie.</p><label><span>NOM DE LA PÉRIODE</span><input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Ex. Vacances de juillet"/></label><div className="form-row"><label><span>DU</span><input type="date" value={startOn} onChange={e=>setStartOn(e.target.value)} required/></label><label><span>AU</span><input type="date" value={endOn} min={startOn} onChange={e=>setEndOn(e.target.value)} required/></label></div><div className="chief-fixed"><ShieldCheck size={19}/><span><b>1 chef de poste</b><small>Pour chaque jour de la période</small></span></div><label><span>ÉQUIPIERS REQUIS</span><select value={required} onChange={e=>setRequired(Number(e.target.value))}>{[1,2,3].map(n=><option key={n}>{n}</option>)}</select></label>{error&&<div className="auth-error">{error}</div>}<button className="primary" disabled={busy}>{busy?'Création…':'Créer l’effectif de période'}</button></form></div>
}

function RoleSwitch({value,onChange}:{value:'admin'|'chief';onChange:(role:'admin'|'chief')=>void}){
  return <div className="role-switch" aria-label="Profil d’utilisation"><button className={value==='admin'?'active':''} onClick={()=>onChange('admin')} type="button">Administrateur</button><button className={value==='chief'?'active':''} onClick={()=>onChange('chief')} type="button">Chef de secteur</button></div>
}

function ProfileName({profile,onSaved}:{profile:Profile;onSaved:()=>void}){const[name,setName]=useState(profile.display_name||'');const[busy,setBusy]=useState(false);return <form className="profile-form" onSubmit={async e=>{e.preventDefault();setBusy(true);await supabase.from('profiles').update({display_name:name}).eq('user_id',profile.user_id);setBusy(false);onSaved()}}><label><span>NOM AFFICHÉ</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Prénom NOM"/></label><button className="primary compact" disabled={busy}>{busy?'Enregistrement…':'Enregistrer'}</button></form>}

export default function App(){
  const[session,setSession]=useState<Session|null>(null)
  const[profile,setProfile]=useState<Profile|null>(null)
  const[loading,setLoading]=useState(true)
  const[recovery,setRecovery]=useState(false)
  const loadProfile=useCallback(async(userId:string)=>{const{data}=await supabase.from('profiles').select('user_id,email,display_name,phone,role,must_set_password').eq('user_id',userId).single();setProfile(data as Profile|null)},[])
  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{setSession(data.session);if(data.session)void loadProfile(data.session.user.id);else setLoading(false)})
    const{data:{subscription}}=supabase.auth.onAuthStateChange((event,next)=>{setSession(next);if(event==='PASSWORD_RECOVERY')setRecovery(true);if(next)window.setTimeout(()=>void loadProfile(next.user.id),0);else{setProfile(null);setLoading(false)}})
    return()=>subscription.unsubscribe()
  },[loadProfile])
  useEffect(()=>{if(!session||profile)setLoading(false)},[session,profile])
  if(loading)return <div className="boot"><img src="/vigi-logo.png" alt="Vigi"/><RefreshCw className="spin"/></div>
  if(!session)return <AuthScreen/>
  if(!profile)return <div className="boot"><img src="/vigi-logo.png" alt="Vigi"/><p>Initialisation du profil sécurisé…</p><RefreshCw className="spin"/></div>
  if(profile.must_set_password||recovery)return <PasswordSetup profile={profile} onComplete={()=>{setRecovery(false);void loadProfile(session.user.id)}}/>
  return <AppShell session={session} profile={profile} onProfileRefresh={()=>void loadProfile(session.user.id)}/>
}
