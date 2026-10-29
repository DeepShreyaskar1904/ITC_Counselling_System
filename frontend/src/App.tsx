import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import { createEnquiry, getCourses } from './services/api'

import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'

import {

  ArrowRight, BarChart3, Bell, BookOpen, Bot, Check, ChevronDown, CircleHelp, Clock3, Copy,

  Database, Edit3, Eye, EyeOff, FileText, GraduationCap, LayoutDashboard, LogOut, Menu, MessageSquare,

  MoreHorizontal, Plus, RefreshCw, Search, Send, Settings, ShieldCheck, Sparkles, Star, Trash2,

  TrendingUp, Upload, Users, X, Zap

} from 'lucide-react'



type Course = {

  id:string; name:string; slug:string; category:string; level:string; duration:string; description:string;

  published:boolean; skills:string[]; careers:string[]; syllabus:string[]; batch:string

}

type Enquiry = { id:string; name:string; email:string; course:string; status:'New'|'Contacted'|'Resolved'; date:string }

type FAQ = { id:string; question:string; answer:string; published:boolean }



const seedCourses: Course[] = [

  {id:'python',name:'Python Programming',slug:'python-programming',category:'Programming',level:'Beginner',duration:'Self-paced demo',description:'Build a strong programming foundation with practical Python projects and guided exercises.',published:true,skills:['Python','Problem solving','APIs'],careers:['Junior developer','Automation associate'],syllabus:['Python foundations','Data structures','Functions & modules','Practical project'],batch:'Schedule available after counselling'},

  {id:'web',name:'Web Development',slug:'web-development',category:'Development',level:'Beginner',duration:'Flexible demo format',description:'Learn to design and build responsive modern web experiences from front end to deployment.',published:true,skills:['HTML & CSS','JavaScript','React'],careers:['Frontend developer','Web designer'],syllabus:['Web foundations','Responsive UI','JavaScript','React project'],batch:'Schedule available after counselling'},

  {id:'data',name:'Data Science',slug:'data-science',category:'Data',level:'Intermediate',duration:'Flexible demo format',description:'Turn data into useful insights through analysis, visualization, and applied case studies.',published:true,skills:['Data analysis','Visualization','Statistics'],careers:['Data analyst','BI associate'],syllabus:['Data literacy','Analysis with Python','Visualization','Capstone study'],batch:'Schedule available after counselling'},

  {id:'ml',name:'Machine Learning',slug:'machine-learning',category:'AI & ML',level:'Intermediate',duration:'Flexible demo format',description:'Understand core machine learning methods and build responsible predictive solutions.',published:true,skills:['Modeling','Evaluation','Feature engineering'],careers:['ML associate','Data scientist'],syllabus:['ML foundations','Supervised learning','Model evaluation','Applied project'],batch:'Schedule available after counselling'},

  {id:'ai',name:'Artificial Intelligence',slug:'artificial-intelligence',category:'AI & ML',level:'Advanced',duration:'Flexible demo format',description:'Explore modern AI concepts, responsible applications, and solution design.',published:true,skills:['AI strategy','Prompt design','Responsible AI'],careers:['AI solutions associate','Product analyst'],syllabus:['AI landscape','Knowledge systems','Generative AI','Solution project'],batch:'Schedule available after counselling'},

]

const seedEnquiries:Enquiry[] = [

  {id:'ENQ-1042',name:'Aarav Mehta',email:'aarav@example.demo',course:'Data Science',status:'New',date:'Today, 10:42'},

  {id:'ENQ-1041',name:'Nisha Rao',email:'nisha@example.demo',course:'Web Development',status:'Contacted',date:'Today, 09:18'},

  {id:'ENQ-1040',name:'Rohan Das',email:'rohan@example.demo',course:'Python Programming',status:'Resolved',date:'Yesterday'},

]

const seedFaqs:FAQ[] = [

  {id:'1',question:'How do I choose the right course?',answer:'Use AI counselling for a guided shortlist, then confirm details with a human counsellor.',published:true},

  {id:'2',question:'Are course fees shown here?',answer:'No. Demo mode never invents fees. Contact the institute for verified current information.',published:true},

  {id:'3',question:'Can I request personal counselling?',answer:'Yes. Submit an enquiry and a counsellor can follow up using your preferred contact details.',published:true},

]

const useLocal = <T,>(key:string, initial:T) => {

  const [value,setValue] = useState<T>(()=>{ try { return JSON.parse(localStorage.getItem(key)||'') } catch { return initial } })

  const save=(next:T)=>{ setValue(next); localStorage.setItem(key,JSON.stringify(next)) }

  return [value,save] as const

}



function Button({children,onClick,variant='primary',type='button',className='',disabled=false}:{children:ReactNode;onClick?:()=>void;variant?:'primary'|'secondary'|'ghost'|'danger';type?:'button'|'submit';className?:string;disabled?:boolean}) {

  return <button type={type} disabled={disabled} onClick={onClick} className={`btn btn-${variant} ${className}`}>{children}</button>

}

function Field({label,required=false,error,children}:{label:string;required?:boolean;error?:string;children:ReactNode}) {

  return <label className="field"><span>{label}{required&&<b> *</b>}</span>{children}{error&&<small>{error}</small>}</label>

}

function Badge({children,tone='blue'}:{children:ReactNode;tone?:string}) { return <span className={`badge badge-${tone}`}>{children}</span> }

function DemoBadge(){return <Badge tone="purple"><Sparkles size={13}/> Demo Mode</Badge>}

function Empty({title,copy}:{title:string;copy:string}){return <div className="empty"><Search/><h3>{title}</h3><p>{copy}</p></div>}

function Toast({text,onClose}:{text:string;onClose:()=>void}){return <div className="toast"><Check size={18}/>{text}<button onClick={onClose}><X size={16}/></button></div>}



const publicNav=[['Courses','/courses'],['AI Counsellor','/chat'],['Enquiry','/enquiry']]

function PublicShell({children}:{children:ReactNode}) {

  const [open,setOpen]=useState(false)

  return <><header className="topbar"><Link to="/" className="brand"><span>ITC</span><div>ITC Counselling<small>Education guidance</small></div></Link>

    <nav className={open?'open':''}>{publicNav.map(([l,p])=><NavLink key={p} to={p} onClick={()=>setOpen(false)}>{l}</NavLink>)}<Link to="/login"><Button variant="secondary">Admin login</Button></Link></nav>

    <div className="top-actions"><DemoBadge/><button className="icon mobile" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div>

  </header><main>{children}</main></>

}

function Footer(){return <footer><div className="brand light"><span>ITC</span><div>ITC Counselling<small>DEMO institute experience</small></div></div><p>Explore courses confidently with AI-assisted and human counselling.</p><div><Link to="/courses">Courses</Link><Link to="/chat">AI counsellor</Link><Link to="/enquiry">Contact</Link></div><small>© 2026 ITC Counselling System. All institute records and information shown are DEMO.</small></footer>}



function Landing({courses}:{courses:Course[]}) {

  const nav=useNavigate()

  return <PublicShell><section className="hero"><div className="hero-copy"><Badge tone="purple"><Sparkles size={14}/> AI-powered course discovery</Badge><h1>Find the Right Course for Your <em>Future with AI</em></h1><p>Turn your ambitions into a clear learning path with thoughtful recommendations, verified course information, and human support when you need it.</p><div className="hero-actions"><Button onClick={()=>nav('/chat')}>Start counselling <ArrowRight size={17}/></Button><Button variant="secondary" onClick={()=>nav('/courses')}>Explore courses</Button></div><div className="trust"><span><Check/>No sign-up required</span><span><Check/>Human support available</span><span><Check/>Demo information labelled</span></div></div>

    <div className="ai-card"><div className="ai-head"><span><Bot/></span><div><b>AI Course Counsellor</b><small>Online · demo responses</small></div></div><div className="bubble">Tell me your interests and goals. I’ll help you build a course shortlist.</div><div className="mini-reco"><BookOpen/><div><small>TOP MATCH</small><b>Data Science</b><span>Based on analytical interests</span></div><Badge tone="green">92%</Badge></div><div className="typing"><i/><i/><i/> Preparing a follow-up...</div></div></section>

    <section className="stats"><div><b>5</b><span>Demo courses</span></div><div><b>24/7</b><span>AI guidance</span></div><div><b>100%</b><span>Transparent demo data</span></div><div><b>1:1</b><span>Human counselling</span></div></section>

    <section className="section"><div className="section-head"><div><Badge>Explore pathways</Badge><h2>Courses built around your next step</h2><p>Discover practical learning paths for different interests and experience levels.</p></div><Link to="/courses">View all courses <ArrowRight size={16}/></Link></div><div className="course-grid">{courses.slice(0,3).map(c=><CourseCard key={c.id} course={c}/>)}</div></section>

    <section className="soft-section"><div className="section-head centered"><Badge tone="purple">Why ITC</Badge><h2>Guidance that puts your goals first</h2></div><div className="benefits">{[[Bot,'Personalized recommendations','Explore options shaped around your interests and current skills.'],[ShieldCheck,'Verified information','Clear disclaimers keep demo content separate from confirmed facts.'],[Users,'Human support','Move from AI guidance to a real counselling request at any time.']].map(([I,t,c]:any)=><article key={t}><span><I/></span><h3>{t}</h3><p>{c}</p></article>)}</div></section>

    <section className="section"><div className="section-head centered"><Badge>Simple process</Badge><h2>From question to confident choice</h2></div><div className="steps">{['Share your goals','Get a tailored shortlist','Connect with a counsellor'].map((s,i)=><div key={s}><b>0{i+1}</b><h3>{s}</h3><p>{['Tell us what you enjoy, your education, and where you want to go.','Compare recommended courses, skills, and career directions.','Request verified details about admissions, batches, and fees.'][i]}</p></div>)}</div></section>

    <section className="cta"><div><Badge tone="purple">Ready when you are</Badge><h2>Start building your learning path today.</h2><p>Get a thoughtful course recommendation in just a few messages.</p></div><Button onClick={()=>nav('/chat')}>Start free counselling <ArrowRight size={17}/></Button></section>

    <section className="section faq-home"><div><Badge>Common questions</Badge><h2>Everything you need to know</h2><p>Still unsure? Our demo counsellor can help you navigate the next step.</p><Link to="/enquiry">Contact the institute <ArrowRight size={16}/></Link></div><div>{seedFaqs.map((f,i)=><details key={f.id} open={i===0}><summary>{f.question}<ChevronDown/></summary><p>{f.answer}</p></details>)}</div></section><Footer/></PublicShell>

}

function CourseCard({course}:{course:Course}){return <article className="course-card"><div className={`course-art art-${course.id}`}><BookOpen/><Badge tone="white">{course.level}</Badge></div><div><span className="eyebrow">{course.category}</span><h3>{course.name}</h3><p>{course.description}</p><div className="meta"><span><Clock3/> {course.duration}</span><span><GraduationCap/> {course.skills.length} skills</span></div><Link to={`/courses/${course.id}`}>View course <ArrowRight size={16}/></Link></div></article>}

function Courses({courses}:{courses:Course[]}) {

  const [q,setQ]=useState(''); const [cat,setCat]=useState('All'); const [sort,setSort]=useState('Recommended')

  const list=useMemo(()=>courses.filter(c=>c.published&&(cat==='All'||c.category===cat)&&(c.name+c.description).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>sort==='A–Z'?a.name.localeCompare(b.name):0),[courses,q,cat,sort])

  const cats=['All',...new Set(courses.map(c=>c.category))]

  return <PublicShell><div className="page-hero"><Badge>Course explorer</Badge><h1>Find a course that fits your ambition</h1><p>Search and compare transparent demo course pathways.</p></div><div className="section explorer"><div className="filterbar"><div className="search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search courses or skills"/></div><select value={sort} onChange={e=>setSort(e.target.value)}><option>Recommended</option><option>A–Z</option></select></div><div className="chips">{cats.map(c=><button className={cat===c?'active':''} onClick={()=>setCat(c)} key={c}>{c}</button>)}{(q||cat!=='All')&&<button onClick={()=>{setQ('');setCat('All')}}><X/> Clear filters</button>}</div><div className="resultline"><b>{list.length} courses</b><span>All content marked as demo</span></div>{list.length?<div className="course-grid">{list.map(c=><CourseCard key={c.id} course={c}/>)}</div>:<Empty title="No matching courses" copy="Try a broader search or clear your filters."/>}</div><Footer/></PublicShell>

}

function CourseDetail({courses}:{courses:Course[]}) {

  const {id}=useParams(); const c=courses.find(x=>x.id===id); const nav=useNavigate(); if(!c)return <NotFound/>

  return <PublicShell><div className="detail-hero"><div><Link to="/courses" className="back">← All courses</Link><div><Badge>{c.category}</Badge> <Badge tone="purple">{c.level}</Badge></div><h1>{c.name}</h1><p>{c.description}</p><div className="hero-actions"><Button onClick={()=>nav(`/chat?course=${c.id}`)}><Bot/> Ask AI</Button><Button variant="secondary" onClick={()=>nav(`/enquiry?course=${c.id}`)}>Request counselling</Button></div></div><aside><small>COURSE SNAPSHOT · DEMO</small><dl><div><dt>Duration</dt><dd>{c.duration}</dd></div><div><dt>Level</dt><dd>{c.level}</dd></div><div><dt>Fees</dt><dd>Contact institute</dd></div><div><dt>Next batch</dt><dd>Not published</dd></div></dl><Button className="full" onClick={()=>nav(`/enquiry?course=${c.id}`)}>Enquire about this course</Button></aside></div>

  <div className="detail-grid section"><div><section className="content-card"><h2>What you’ll learn</h2><div className="skill-list">{c.skills.map(s=><span key={s}><Check/>{s}</span>)}</div></section><section className="content-card"><h2>Syllabus overview</h2>{c.syllabus.map((s,i)=><div className="module" key={s}><b>{String(i+1).padStart(2,'0')}</b><div><h3>{s}</h3><p>Guided concepts, practical exercises, and a demo learning checkpoint.</p></div></div>)}</section><section className="content-card"><h2>Projects & outcomes</h2><p>Apply your learning through a portfolio-ready guided project. Exact projects may vary and should be confirmed with the institute.</p></section></div><aside className="side-stack"><div className="content-card"><h3>Eligibility & prerequisites</h3><p>Suitable for motivated learners. Specific admission requirements are not provided in demo mode.</p></div><div className="content-card"><h3>Career directions</h3>{c.careers.map(x=><Badge key={x} tone="gray">{x}</Badge>)}</div><div className="content-card"><h3>Need a human answer?</h3><p>Ask about verified fees, schedules, eligibility, or admissions.</p><Button className="full" onClick={()=>nav(`/enquiry?course=${c.id}`)}>Contact a counsellor</Button></div></aside></div><Footer/></PublicShell>

}



type Msg={role:'user'|'ai';text:string}

function Chat({courses}:{courses:Course[]}) {

 const [sessions,setSessions]=useLocal('itc-chats',[{id:'demo-1',title:'Choosing a data course',date:'Today'}]); const [active,setActive]=useState('demo-1'); const [messages,setMessages]=useState<Msg[]>([{role:'ai',text:"Hi! I’m the ITC demo AI counsellor. Tell me about your interests, education, and goals, and I’ll suggest a direction."}]); const [input,setInput]=useState(''); const [typing,setTyping]=useState(false); const [mobile,setMobile]=useState(false)

 const send=(text=input)=>{if(!text.trim())return;setMessages(m=>[...m,{role:'user',text}]);setInput('');setTyping(true);setTimeout(()=>{setMessages(m=>[...m,{role:'ai',text:"Based on what you’ve shared, Python Programming and Data Science could be useful starting points. This is a mock AI recommendation, not verified admission advice. Would you like to compare prerequisites or career directions?"}]);setTyping(false)},700)}

 return <PublicShell><div className="chat-shell"><aside className={mobile?'chat-side open':'chat-side'}><div className="chat-side-head"><b>Conversations</b><button className="icon mobile" onClick={()=>setMobile(false)}><X/></button></div><Button className="full" onClick={()=>{const id=Date.now().toString();setSessions([{id,title:'New counselling chat',date:'Now'},...sessions]);setActive(id);setMessages([{role:'ai',text:'Welcome! What would you like help choosing today?'}])}}><Plus/> New conversation</Button><div className="session-list">{sessions.map(s=><button key={s.id} className={active===s.id?'active':''} onClick={()=>{setActive(s.id);setMobile(false)}}><MessageSquare/><span><b>{s.title}</b><small>{s.date}</small></span><MoreHorizontal/></button>)}</div><div className="disclaimer"><ShieldCheck/><p><b>Verified information matters</b><br/>AI can make mistakes. Confirm fees, admissions, and schedules with a human.</p></div></aside>

 <section className="chat-main"><header><button className="icon mobile" onClick={()=>setMobile(true)}><Menu/></button><div><b>AI Course Counsellor</b><span><i/> Online · mock responses</span></div><button className="icon" title="Clear conversation" onClick={()=>confirm('Clear this demo conversation?')&&setMessages([])}><Trash2/></button></header><div className="messages">{messages.length===1&&<div className="prompt-grid">{['Help me choose between AI and ML','I want to start coding','Which course suits data careers?'].map(p=><button onClick={()=>send(p)} key={p}><Sparkles/>{p}</button>)}</div>}{messages.map((m,i)=><div key={i} className={`message ${m.role}`}><span>{m.role==='ai'?<Bot/>:'You'}</span><div><Badge tone={m.role==='ai'?'purple':'blue'}>{m.role==='ai'?'MOCK AI RESPONSE':'YOUR MESSAGE'}</Badge><p>{m.text}</p>{m.role==='ai'&&i>0&&<><div className="recommendations">{courses.slice(0,2).map(c=><Link key={c.id} to={`/courses/${c.id}`}><BookOpen/><span><b>{c.name}</b><small>{c.level} · {c.category}</small></span><ArrowRight/></Link>)}</div><div className="msg-actions"><button onClick={()=>navigator.clipboard?.writeText(m.text)}><Copy/> Copy</button><button onClick={()=>send('Regenerate that response')}><RefreshCw/> Regenerate</button><button>Helpful?</button></div></>}</div></div>)}{typing&&<div className="message ai"><span><Bot/></span><div className="typing"><i/><i/><i/> Thinking...</div></div>}</div><div className="composer"><div><textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} placeholder="Ask about courses, skills, or career directions…"/><Button onClick={()=>send()}><Send/></Button></div><small>Demo AI responses may be incomplete. Missing answers will be referred to a human counsellor.</small></div></section></div></PublicShell>

}



function Enquiry({ courses }: { courses: Course[] }) {
  const nav = useNavigate();
  const preset = new URLSearchParams(location.search).get("course") || "";
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const education = String(fd.get("education") || "").trim();
    const selectedCourse = String(fd.get("course") || "").trim();
    const batch = String(fd.get("batch") || "").trim();
    const question = String(fd.get("question") || "").trim();
    const nextErrors: Record<string, string> = {};

    if (!name) nextErrors.name = "Name is required";
    if (!email) nextErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address";
    }
    if (!education) nextErrors.education = "Select your education";
    if (!selectedCourse) nextErrors.course = "Select a course";
    if (!question) nextErrors.question = "Please enter your question";

    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      // The course field in Django is a foreign key, so only send a numeric database ID.
      // Demo course IDs such as "web" are not valid database IDs.
      const courseId = /^\d+$/.test(selectedCourse) ? Number(selectedCourse) : null;

      await createEnquiry({
        name,
        email,
        phone: phone || undefined,
        education_level: education,
        course: courseId,
        preferred_batch: batch,
        question,
      });

      setDone(true);
      form.reset();
    } catch (error) {
      console.error("Enquiry submission failed:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to submit enquiry. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return <PublicShell>
      <div className="success-page">
        <span><Check /></span>
        <Badge tone="green">Enquiry submitted</Badge>
        <h1>Thank you! Your enquiry has been submitted.</h1>
        <p>Your request has been received successfully. Our counselling team can review your enquiry.</p>
        <div>
          <Button onClick={() => nav('/courses')}>Explore courses</Button>
          <Button variant="secondary" onClick={() => setDone(false)}>Send another</Button>
        </div>
      </div>
      <Footer />
    </PublicShell>;
  }

  return <PublicShell>
    <div className="form-page">
      <div>
        <Badge>Human counselling</Badge>
        <h1>Let’s find your next step</h1>
        <p>Share a few details and a counsellor can help you verify course fit, admission information, fees, and schedules.</p>
        <div className="contact-points">
          <div><ShieldCheck /><span><b>Your details are submitted securely</b><small>Your enquiry is sent to the institute backend.</small></span></div>
          <div><MessageSquare /><span><b>Ask anything</b><small>If AI cannot answer, request human assistance here.</small></span></div>
        </div>
      </div>
      <form onSubmit={submit} className="form-card">
        <div className="form-head"><h2>Request counselling</h2><DemoBadge /></div>
        {submitError && <div className="errorbox" role="alert">{submitError}</div>}
        <div className="two-col">
          <Field label="Full name" required error={errors.name}><input name="name" placeholder="Your full name" /></Field>
          <Field label="Email address" required error={errors.email}><input name="email" type="email" placeholder="you@example.com" /></Field>
        </div>
        <div className="two-col">
          <Field label="Phone (optional)"><input name="phone" placeholder="+91 00000 00000" /></Field>
          <Field label="Current education" required error={errors.education}>
            <select name="education" defaultValue=""><option value="" disabled>Select education</option><option>High school</option><option>Undergraduate</option><option>Graduate</option><option>Working professional</option><option>12th Pass</option></select>
          </Field>
        </div>
        <div className="two-col">
          <Field label="Course interest" required error={errors.course}>
            <select name="course" defaultValue={preset}><option value="" disabled>Select a course</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </Field>
          <Field label="Preferred batch">
            <select name="batch"><option>Flexible / not sure</option><option>Weekday preference</option><option>Weekend preference</option></select>
          </Field>
        </div>
        <Field label="How can we help?" required error={errors.question}><textarea name="question" placeholder="Tell us about your goals or what you’d like verified…" /></Field>
        <Button type="submit" className="full" disabled={loading}>{loading ? <><RefreshCw className="spin" /> Submitting...</> : <>Submit enquiry <ArrowRight /></>}</Button>
        <small>Submitting this form sends your details to the counselling backend.</small>
      </form>
    </div>
    <Footer />
  </PublicShell>;
}


function Login(){

 const [show,setShow]=useState(false);const [error,setError]=useState('');const nav=useNavigate()

 const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const fd=new FormData(e.currentTarget);if(!fd.get('email')||!fd.get('password'))return setError('Enter the demo email and password.');if(fd.get('email')!=='admin@demo.itc')return setError('Demo credentials not recognized. Try the values shown below.');localStorage.setItem('itc-auth','demo');nav('/admin')}

 return <div className="login"><div className="login-side"><Link to="/" className="brand light"><span>ITC</span><div>ITC Counselling<small>Education guidance</small></div></Link><div><Badge tone="purple"><Sparkles/> Admin workspace</Badge><h1>Manage every student journey in one place.</h1><p>Keep courses, enquiries, conversations, and trusted knowledge organized.</p></div><small>DEMO environment · No real data</small></div><div className="login-form"><form onSubmit={submit}><DemoBadge/><h2>Welcome back</h2><p>Sign in to the simulated admin workspace.</p>{error&&<div className="errorbox">{error}</div>}<Field label="Email address" required><input name="email" type="email" defaultValue="admin@demo.itc"/></Field><Field label="Password" required><div className="password"><input name="password" type={show?'text':'password'} defaultValue="demo123"/><button type="button" onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</button></div></Field><Button type="submit" className="full">Sign in to demo <ArrowRight/></Button><div className="demo-creds"><b>Simulated login</b><span>admin@demo.itc / demo123</span></div><Link to="/">← Back to public website</Link></form></div></div>

}



const adminNav=[['Overview','/admin',LayoutDashboard],['Courses','/admin/courses',BookOpen],['Enquiries','/admin/enquiries',Users],['Conversations','/admin/conversations',MessageSquare],['FAQs','/admin/faqs',CircleHelp],['Knowledge base','/admin/knowledge-base',Database],['Settings','/admin/settings',Settings]]

function AdminShell({children,title,action}:{children:ReactNode;title:string;action?:ReactNode}){

 const [open,setOpen]=useState(false);const nav=useNavigate()

 return <div className="admin-shell"><aside className={open?'admin-side open':'admin-side'}><div className="brand light"><span>ITC</span><div>ITC Admin<small>Counselling system</small></div><button className="icon mobile" onClick={()=>setOpen(false)}><X/></button></div><DemoBadge/><nav>{adminNav.map(([l,p,I]:any)=><NavLink key={p} to={p} end={p==='/admin'} onClick={()=>setOpen(false)}><I/>{l}</NavLink>)}</nav><div className="admin-user"><span>AD</span><div><b>Admin Demo</b><small>Super administrator</small></div><button onClick={()=>{localStorage.removeItem('itc-auth');nav('/login')}}><LogOut/></button></div></aside><main className="admin-main"><header><button className="icon mobile" onClick={()=>setOpen(true)}><Menu/></button><div className="admin-search"><Search/><input placeholder="Search workspace…"/></div><button className="icon notify"><Bell/><i/></button><span className="avatar">AD</span></header><div className="admin-content"><div className="admin-title"><div><small>Admin / {title}</small><h1>{title}</h1></div>{action}</div>{children}</div></main></div>

}

function Dashboard({courses,enquiries}:{courses:Course[];enquiries:Enquiry[]}) {

 return <AdminShell title="Overview"><div className="kpis">{[[BookOpen,courses.length,'Total courses','+2 this quarter'],[Users,enquiries.length,'Total enquiries','+18% this month'],[MessageSquare,128,'Chat sessions','+12% this week'],[Clock3,7,'Pending requests','Needs attention']].map(([I,n,l,t]:any)=><article key={l}><span><I/></span><div><small>{l}</small><b>{n}</b><em>{t}</em></div></article>)}</div><div className="dashboard-grid"><section className="panel chart-panel"><div className="panel-head"><div><h2>Student engagement</h2><p>Enquiries and chat sessions · demo</p></div><select><option>Last 7 days</option><option>Last 30 days</option></select></div><div className="chart"><div className="y-labels"><span>60</span><span>40</span><span>20</span><span>0</span></div>{[38,55,44,70,62,86,75].map((v,i)=><div className="bar-group" key={i}><i style={{height:`${v}%`}}/><b style={{height:`${v*.65}%`}}/><small>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</small></div>)}</div></section><section className="panel"><div className="panel-head"><div><h2>Popular courses</h2><p>By student interest</p></div><TrendingUp/></div>{courses.slice(0,4).map((c,i)=><div className="rank" key={c.id}><b>0{i+1}</b><span>{c.name}<small>{[42,36,29,21][i]} enquiries</small></span><div><i style={{width:`${90-i*15}%`}}/></div></div>)}</section></div><section className="panel table-panel"><div className="panel-head"><div><h2>Recent enquiries</h2><p>Latest demo counselling requests</p></div><Link to="/admin/enquiries">View all <ArrowRight/></Link></div><EnquiryTable enquiries={enquiries}/></section></AdminShell>

}

function EnquiryTable({enquiries,onStatus}:{enquiries:Enquiry[];onStatus?:(id:string,s:Enquiry['status'])=>void}){return <div className="table-wrap"><table><thead><tr><th>Student</th><th>Course interest</th><th>Status</th><th>Received</th><th></th></tr></thead><tbody>{enquiries.map(e=><tr key={e.id}><td><b>{e.name}</b><small>{e.email}</small></td><td>{e.course}</td><td>{onStatus?<select className={`status ${e.status.toLowerCase()}`} value={e.status} onChange={x=>onStatus(e.id,x.target.value as Enquiry['status'])}><option>New</option><option>Contacted</option><option>Resolved</option></select>:<Badge tone={e.status==='New'?'blue':e.status==='Resolved'?'green':'purple'}>{e.status}</Badge>}</td><td>{e.date}</td><td><Button variant="ghost">View</Button></td></tr>)}</tbody></table></div>}

function AdminCourses({courses,setCourses}:{courses:Course[];setCourses:(c:Course[])=>void}){

 const [q,setQ]=useState('');const [page,setPage]=useState(1);const [toast,setToast]=useState('');const list=courses.filter(c=>c.name.toLowerCase().includes(q.toLowerCase()))

 const update=(id:string,patch:Partial<Course>)=>{setCourses(courses.map(c=>c.id===id?{...c,...patch}:c));setToast('Course updated successfully')}

 return <AdminShell title="Courses" action={<Link to="/admin/courses/new"><Button><Plus/> Add course</Button></Link>}><div className="panel"><div className="toolbar"><div className="search"><Search/><input placeholder="Search courses…" value={q} onChange={e=>setQ(e.target.value)}/></div><select><option>All categories</option><option>AI & ML</option><option>Programming</option></select><select><option>All statuses</option><option>Published</option><option>Draft</option></select></div><div className="table-wrap"><table><thead><tr><th>Course</th><th>Category</th><th>Level</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{list.slice((page-1)*5,page*5).map(c=><tr key={c.id}><td><b>{c.name}</b><small>/{c.slug}</small></td><td>{c.category}</td><td>{c.level}</td><td><button className={`toggle ${c.published?'on':''}`} onClick={()=>update(c.id,{published:!c.published})}><i/>{c.published?'Published':'Draft'}</button></td><td>Recently</td><td className="actions"><Link to={`/courses/${c.id}`} title="View"><Eye/></Link><Link to={`/admin/courses/${c.id}/edit`} title="Edit"><Edit3/></Link><button title="Delete" onClick={()=>confirm(`Delete ${c.name}?`)&&(setCourses(courses.filter(x=>x.id!==c.id)),setToast('Course deleted'))}><Trash2/></button></td></tr>)}</tbody></table></div><div className="pagination"><span>Showing {list.length} demo records</span><div><Button variant="secondary" onClick={()=>setPage(Math.max(1,page-1))}>Previous</Button><Button>{page}</Button><Button variant="secondary" onClick={()=>setPage(page+1)}>Next</Button></div></div></div>{toast&&<Toast text={toast} onClose={()=>setToast('')}/>}</AdminShell>

}

function CourseForm({courses,setCourses}:{courses:Course[];setCourses:(c:Course[])=>void}){

 const {id}=useParams();const editing=courses.find(c=>c.id===id);const nav=useNavigate();const [modules,setModules]=useState(editing?.syllabus||['Course foundations']);const [published,setPublished]=useState(editing?.published??false)

 const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);const name=String(f.get('name'));const next:Course={id:editing?.id||Date.now().toString(),name,slug:String(f.get('slug')),category:String(f.get('category')),level:String(f.get('level')),duration:String(f.get('duration')),description:String(f.get('description')),published,skills:String(f.get('skills')).split(',').map(x=>x.trim()),careers:String(f.get('careers')).split(',').map(x=>x.trim()),syllabus:modules,batch:String(f.get('batch'))};setCourses(editing?courses.map(c=>c.id===editing.id?next:c):[next,...courses]);nav('/admin/courses')}

 return <AdminShell title={editing?'Edit course':'Add course'}><form className="course-form" onSubmit={submit}><section className="panel"><h2>Course information</h2><div className="two-col"><Field label="Course name" required><input name="name" required defaultValue={editing?.name}/></Field><Field label="URL slug" required><input name="slug" required defaultValue={editing?.slug}/></Field></div><Field label="Description" required><textarea name="description" required defaultValue={editing?.description}/></Field><div className="three-col"><Field label="Category"><select name="category" defaultValue={editing?.category}><option>Programming</option><option>Development</option><option>Data</option><option>AI & ML</option></select></Field><Field label="Level"><select name="level" defaultValue={editing?.level}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></Field><Field label="Duration"><input name="duration" defaultValue={editing?.duration}/></Field></div></section><section className="panel"><div className="panel-head"><div><h2>Syllabus modules</h2><p>Add and reorder learning modules.</p></div><Button variant="secondary" onClick={()=>setModules([...modules,'New module'])}><Plus/> Add module</Button></div>{modules.map((m,i)=><div className="module-edit" key={i}><b>{i+1}</b><input value={m} onChange={e=>setModules(modules.map((x,j)=>j===i?e.target.value:x))}/><button type="button" onClick={()=>setModules(modules.filter((_,j)=>j!==i))}><Trash2/></button></div>)}</section><section className="panel"><h2>Outcomes & admissions</h2><div className="two-col"><Field label="Skills (comma separated)"><input name="skills" defaultValue={editing?.skills.join(', ')}/></Field><Field label="Career paths (comma separated)"><input name="careers" defaultValue={editing?.careers.join(', ')}/></Field></div><Field label="Batch / admission note"><input name="batch" defaultValue={editing?.batch}/></Field><div className="publish-row"><div><b>Publication status</b><p>Published courses are visible in the public explorer.</p></div><button type="button" className={`toggle ${published?'on':''}`} onClick={()=>setPublished(!published)}><i/>{published?'Published':'Draft'}</button></div></section><div className="form-actions"><Button variant="secondary" onClick={()=>nav('/admin/courses')}>Cancel</Button><Button type="submit">Save course <Check/></Button></div></form></AdminShell>

}

function AdminEnquiries({enquiries,setEnquiries}:{enquiries:Enquiry[];setEnquiries:(e:Enquiry[])=>void}){

 const [q,setQ]=useState('');const [toast,setToast]=useState('');const filtered=enquiries.filter(e=>(e.name+e.email+e.course).toLowerCase().includes(q.toLowerCase()))

 return <AdminShell title="Enquiries"><div className="panel"><div className="toolbar"><div className="search"><Search/><input placeholder="Search name, email, course…" value={q} onChange={e=>setQ(e.target.value)}/></div><select><option>All statuses</option><option>New</option><option>Contacted</option><option>Resolved</option></select><Button variant="secondary">Export demo</Button></div><EnquiryTable enquiries={filtered} onStatus={(id,status)=>{setEnquiries(enquiries.map(e=>e.id===id?{...e,status}:e));setToast('Enquiry status updated')}}/></div>{toast&&<Toast text={toast} onClose={()=>setToast('')}/>}</AdminShell>

}

function Conversations(){return <AdminShell title="Conversations"><div className="split-panel"><section className="panel conversation-list"><div className="toolbar"><div className="search"><Search/><input placeholder="Search conversations…"/></div><input type="date"/></div>{['Choosing between AI and ML','Best course after B.Com','Web development prerequisites','Course fee question'].map((x,i)=><button key={x} className={i===0?'active':''}><span className="avatar">{['AM','NK','RS','PP'][i]}</span><span><b>{x}</b><small>{i===3?'Unanswered · ':'AI answered · '}Today</small></span><Badge tone={i===3?'orange':'green'}>{i===3?'Needs help':`${5-i}/5`}</Badge></button>)}</section><section className="panel conversation-detail"><div className="panel-head"><div><h2>Choosing between AI and ML</h2><p>Session DEMO-CHAT-092 · Today, 10:24</p></div><Badge tone="green">Helpful · 5/5</Badge></div><div className="transcript"><div className="user"><b>Student</b><p>I enjoy Python and statistics. Should I study AI or machine learning first?</p></div><div className="agent"><b>Mock AI response</b><p>Machine Learning may be the more focused next step because it builds directly on Python and statistics. The broader AI course could follow later.</p></div><div className="user"><b>Student</b><p>What prerequisites should I verify?</p></div></div><div className="notice"><ShieldCheck/> Conversation content is demo data. Answers about admissions should be verified by staff.</div></section></div></AdminShell>}

function AdminFaqs({faqs,setFaqs}:{faqs:FAQ[];setFaqs:(f:FAQ[])=>void}){

 const [editing,setEditing]=useState<FAQ|null>(null);const [toast,setToast]=useState('')

 const save=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);const next={id:editing?.id||Date.now().toString(),question:String(f.get('question')),answer:String(f.get('answer')),published:true};setFaqs(editing?faqs.map(x=>x.id===editing.id?next:x):[...faqs,next]);setEditing(null);setToast('FAQ saved')}

 return <AdminShell title="FAQs" action={<Button onClick={()=>setEditing({id:'',question:'',answer:'',published:true})}><Plus/> Add FAQ</Button>}><div className="panel faq-admin">{faqs.map(f=><div key={f.id}><span><b>{f.question}</b><small>{f.answer}</small></span><Badge tone="green"><ShieldCheck/> Verified</Badge><button className={`toggle ${f.published?'on':''}`} onClick={()=>setFaqs(faqs.map(x=>x.id===f.id?{...x,published:!x.published}:x))}><i/></button><button onClick={()=>setEditing(f)}><Edit3/></button><button onClick={()=>confirm('Delete this FAQ?')&&setFaqs(faqs.filter(x=>x.id!==f.id))}><Trash2/></button></div>)}</div>{editing&&<div className="modal"><form onSubmit={save}><div className="panel-head"><h2>{editing.id?'Edit FAQ':'Add FAQ'}</h2><button type="button" onClick={()=>setEditing(null)}><X/></button></div><Field label="Question"><input required name="question" defaultValue={editing.question}/></Field><Field label="Verified answer"><textarea required name="answer" defaultValue={editing.answer}/></Field><Field label="Course association"><select><option>General</option>{seedCourses.map(c=><option>{c.name}</option>)}</select></Field><Button type="submit" className="full">Save FAQ</Button></form></div>}{toast&&<Toast text={toast} onClose={()=>setToast('')}/>}</AdminShell>

}

function Knowledge(){const [uploaded,setUploaded]=useState(false);return <AdminShell title="Knowledge base" action={<Button onClick={()=>setUploaded(true)}><Upload/> Upload source</Button>}><div className="notice"><Database/> <div><b>Backend processing required</b><p>Indexing, text extraction, and embeddings will run through the future Django service. This prototype only simulates status changes.</p></div></div><div className="panel upload-zone"><Upload/><h2>Upload trusted course knowledge</h2><p>PDF or text files · Demo UI only · Select a course after upload</p><Button variant="secondary" onClick={()=>setUploaded(true)}>Choose files</Button></div><div className="panel table-panel"><div className="panel-head"><div><h2>Knowledge sources</h2><p>Indexed content available to the AI counsellor</p></div><select><option>All courses</option><option>Python Programming</option></select></div><table><thead><tr><th>Source</th><th>Course</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{[...(uploaded?[['uploaded-demo.pdf','General','Pending']]:[]),['python-outline-demo.pdf','Python Programming','Indexed'],['admission-notes-demo.txt','General','Error']].map((r:any)=><tr key={r[0]}><td><b>{r[0]}</b><small>DEMO source</small></td><td>{r[1]}</td><td><Badge tone={r[2]==='Indexed'?'green':r[2]==='Error'?'orange':'purple'}>{r[2]}</Badge></td><td>Recently</td><td className="actions"><button title="Reindex"><RefreshCw/></button><button title="Delete"><Trash2/></button></td></tr>)}</tbody></table></div></AdminShell>}

function AdminSettings(){const [saved,setSaved]=useState(false);return <AdminShell title="Settings"><form className="settings-grid" onSubmit={e=>{e.preventDefault();setSaved(true)}}><section className="panel"><h2>Institute branding</h2><div className="logo-upload"><span>ITC</span><div><b>Institute logo</b><p>Upload SVG, PNG, or JPG (demo only)</p><Button variant="secondary">Choose logo</Button></div></div><Field label="Institute name"><input defaultValue="ITC Counselling System (DEMO)"/></Field><div className="two-col"><Field label="Contact email"><input defaultValue="hello@example.demo"/></Field><Field label="Phone"><input defaultValue="Not published"/></Field></div></section><section className="panel"><h2>Chatbot experience</h2><Field label="Welcome message"><textarea defaultValue="Hi! Tell me about your interests and goals, and I’ll help you explore demo course options."/></Field><Field label="Supported languages"><select><option>English</option><option>English, Hindi (future)</option></select></Field><Field label="Suggested prompts"><textarea defaultValue={'Help me choose a course\nI want to start coding\nWhich course suits data careers?'}/></Field><Field label="Fallback message"><textarea defaultValue="I don’t have verified information for that yet. Would you like to request help from a human counsellor?"/></Field></section><div className="form-actions"><Button type="submit">Save settings <Check/></Button></div></form>{saved&&<Toast text="Settings saved in demo mode" onClose={()=>setSaved(false)}/>}</AdminShell>}

function NotFound(){return <div className="not-found"><div className="brand"><span>ITC</span><div>ITC Counselling</div></div><b>404</b><h1>This path hasn’t been mapped yet.</h1><p>Let’s get you back to a course that can shape your next step.</p><div><Link to="/"><Button>Go home</Button></Link><Link to="/courses"><Button variant="secondary">Explore courses</Button></Link></div></div>}



// Convert Django REST Framework course records into the shape used by the UI.
function mapApiCourse(raw: any): Course {
  const asStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.map((item: any) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') return String(item.title ?? item.name ?? item.module_name ?? item.label ?? '');
        return String(item ?? '');
      }).filter(Boolean);
    }
    if (typeof value === 'string' && value.trim()) return [value.trim()];
    return [];
  };

  const modules = Array.isArray(raw.modules) ? raw.modules : [];
  const moduleNames = modules.map((item: any) =>
    typeof item === 'string' ? item : String(item?.title ?? item?.name ?? item?.module_name ?? '')
  ).filter(Boolean);
  const skills = asStringArray(raw.skills);
  const careers = asStringArray(raw.career_paths);
  const prerequisites = asStringArray(raw.prerequisites);
  const batches = asStringArray(raw.batches);

  return {
    id: String(raw.id ?? raw.slug ?? ''),
    name: String(raw.name ?? 'Untitled course'),
    slug: String(raw.slug ?? raw.id ?? ''),
    category: String(raw.category ?? 'General'),
    level: String(raw.level ?? 'Beginner').replace(/^./, (c: string) => c.toUpperCase()),
    duration: String(raw.duration ?? 'Contact institute'),
    description: String(raw.description ?? ''),
    published: Boolean(raw.is_published ?? raw.published ?? false),
    skills,
    careers,
    syllabus: moduleNames.length ? moduleNames : prerequisites,
    batch: batches.join(', ') || 'Schedule available after counselling',
  };
}

export default function App(){
  // Course Explorer now uses Django/MySQL data, not the hard-coded demo courses.
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseLoadError, setCourseLoadError] = useState('');
  const [enquiries,setEnquiries]=useLocal<Enquiry[]>('itc-enquiries',seedEnquiries);
  const [faqs,setFaqs]=useLocal<FAQ[]>('itc-faqs',seedFaqs);

  useEffect(() => {
    let active = true;
    getCourses()
      .then((response: any) => {
        const records = Array.isArray(response)
          ? response
          : Array.isArray(response?.results) ? response.results : [];
        if (active) {
          setCourses(records.map(mapApiCourse).filter((course: Course) => course.id && course.published));
          setCourseLoadError('');
        }
      })
      .catch((error: unknown) => {
        console.error('Could not load courses from Django API:', error);
        if (active) {
          setCourseLoadError('Could not load courses from the backend. Check that Django is running and API/CORS settings are correct.');
        }
      });
    return () => { active = false; };
  }, []);

  return <BrowserRouter>
    {courseLoadError && <div role="alert" style={{margin:'12px auto',maxWidth:1100,padding:'12px 16px',color:'#991b1b',background:'#fef2f2',borderRadius:8}}>{courseLoadError}</div>}
    <Routes>
      <Route path="/" element={<Landing courses={courses}/>}/>
      <Route path="/courses" element={<Courses courses={courses}/>}/>
      <Route path="/courses/:id" element={<CourseDetail courses={courses}/>}/>
      <Route path="/chat" element={<Chat courses={courses}/>}/>
      <Route path="/chat/:sessionId" element={<Chat courses={courses}/>}/>
      <Route path="/enquiry" element={<Enquiry courses={courses}/>}/>
      <Route path="/login" element={<Login/>}/>
      <Route path="/admin" element={<Dashboard courses={courses} enquiries={enquiries}/>}/>
      <Route path="/admin/courses" element={<AdminCourses courses={courses} setCourses={setCourses}/>}/>
      <Route path="/admin/courses/new" element={<CourseForm courses={courses} setCourses={setCourses}/>}/>
      <Route path="/admin/courses/:id/edit" element={<CourseForm courses={courses} setCourses={setCourses}/>}/>
      <Route path="/admin/enquiries" element={<AdminEnquiries enquiries={enquiries} setEnquiries={setEnquiries}/>}/>
      <Route path="/admin/conversations" element={<Conversations/>}/>
      <Route path="/admin/faqs" element={<AdminFaqs faqs={faqs} setFaqs={setFaqs}/>}/>
      <Route path="/admin/knowledge-base" element={<Knowledge/>}/>
      <Route path="/admin/settings" element={<AdminSettings/>}/>
      <Route path="*" element={<NotFound/>}/>
    </Routes>
  </BrowserRouter>
}
