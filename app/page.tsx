import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WorkGrid } from '@/components/WorkGrid';
import { ContactForm } from '@/components/ContactForm';
import { getCategories, getPublishedEvents } from '@/lib/content';
import { SHOW_MARQUEE, SHOW_SPOTLIGHT, SITE } from '@/lib/site';

export const revalidate = 60;

const SERVICES = [
  { num: '01', title: 'Event production', body: 'Festivals, galas, launches and weddings — planned, built and run end to end.' },
  { num: '02', title: 'Stage & staging', body: 'Custom sets, rigging and structures designed around your venue and your story.' },
  { num: '03', title: 'Light & sound', body: 'Show lighting, audio and visuals programmed to hit every moment on cue.' },
  { num: '04', title: 'Creative direction', body: 'Concepts, run-of-show and show-calling that give the night a shape.' },
];

const STEPS = [
  { num: '01', title: 'Brief', body: 'We listen: audience, budget, venue, the feeling you want people to leave with.' },
  { num: '02', title: 'Concept', body: 'Moodboards, stage plans and a run-of-show you can react to.' },
  { num: '03', title: 'Build', body: 'Crew, suppliers, tech rehearsals — all under one production manager.' },
  { num: '04', title: 'Show', body: 'We call the cues from the wings. You enjoy the night.' },
];

const WORDS = ['Festivals', 'Launches', 'Concerts', 'Galas', 'Weddings', 'Tours', 'Parties', 'Theatre'];

export default async function Home() {
  const [categories, events] = await Promise.all([getCategories(), getPublishedEvents()]);

  return (
    <div className="page">
      <SiteHeader />

      <section id="top" className="hero">
        {SHOW_SPOTLIGHT && <div className="spotlight" aria-hidden="true" />}
        <div className="wrap hero-inner">
          <div className="eyebrow">Events · Productions · Live experiences</div>
          <h1>We work off stage so your night can <span>steal the show.</span></h1>
          <div className="hero-row">
            <p>A full-service production team for festivals, brand launches, concerts and celebrations — concept, stage, light, sound and every cue in between.</p>
            <div className="btn-row">
              <a href="#contact" className="btn-gold">Plan your event</a>
              <a href="#work" className="btn-ghost">See our work</a>
            </div>
          </div>
        </div>
      </section>

      {SHOW_MARQUEE && (
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[...WORDS, ...WORDS].map((w, i) => (
              <span key={i} className="marquee-item">
                <span>{w}</span>
                <span className="marquee-diamond" />
              </span>
            ))}
          </div>
        </div>
      )}

      <section id="services" className="wrap section">
        <div className="section-head services-head">
          <h2 className="h2">What we run<br />behind the curtain.</h2>
          <p>One crew from first sketch to final bow — so nothing gets lost between vendors.</p>
        </div>
        <div className="services-grid">
          {SERVICES.map(s => (
            <div key={s.num} className="service">
              <div className="num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="work" className="work">
        <div className="wrap section">
          <WorkGrid categories={categories} events={events} />
        </div>
      </section>

      <section id="process" className="wrap section process">
        <h2 className="h2">From idea to<br />house lights down.</h2>
        <div className="steps">
          {STEPS.map(p => (
            <div key={p.num} className="step">
              <div className="num">{p.num}</div>
              <div className="txt">
                <div className="title">{p.title}</div>
                <div className="body">{p.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="contact">
        <div className="wrap section contact-grid">
          <div className="contact-copy">
            <h2>Got a date?<br />We&apos;ve got the crew.</h2>
            <p>Tell us what you&apos;re dreaming up. We reply within one working day.</p>
            <div className="contact-links">
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              <a href={`tel:${SITE.phone}`}>{SITE.phoneLabel}</a>
              <a href={SITE.instagram} target="_blank" rel="noopener">Instagram — {SITE.instagramHandle}</a>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
