// Catai landing — sections, palette logic, copy.
// All of the user-facing copy lives here. Editorial calm direction:
// generous whitespace, large type, almost no ornament, occasional charm.

const PALETTES = {
  salvia: {
    name: 'sálvia',
    paper: '#FAF8F4',
    soft:  '#EDE9DD',
    ink:   '#2D3A2E',
    inkSoft: '#5C6B5E',
    accent:  '#B8D4B5', // pale sage
    accent2: '#6E8E6B', // deeper sage
    line:    'rgba(45,58,46,0.10)',
    rule:    'rgba(45,58,46,0.18)',
  },
  terracota: {
    name: 'terracota',
    paper: '#FAF5EE',
    soft:  '#F0E4D4',
    ink:   '#3A2E28',
    inkSoft: '#6B5A50',
    accent:  '#E5BFA5', // pale terracotta
    accent2: '#B5704D', // deeper terracotta
    line:    'rgba(58,46,40,0.10)',
    rule:    'rgba(58,46,40,0.18)',
  },
  ceu: {
    name: 'azul-céu',
    paper: '#F6F8FA',
    soft:  '#E2EAF0',
    ink:   '#26333D',
    inkSoft: '#566976',
    accent:  '#A8C5D6', // sky blue
    accent2: '#3F6B86', // deeper blue
    line:    'rgba(38,51,61,0.10)',
    rule:    'rgba(38,51,61,0.18)',
  },
};

// ─────────────────────────────────────────────────────────────
// Tiny inline icon set — simple linear strokes only
// ─────────────────────────────────────────────────────────────
const Icon = ({ name, size = 22, color = 'currentColor', stroke = 1.6 }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
              stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'leaf':    return <svg {...p}><path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z"/><path d="M5 19c4-4 7-7 14-14"/></svg>;
    case 'pin':     return <svg {...p}><path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>;
    case 'camera':  return <svg {...p}><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>;
    case 'check':   return <svg {...p}><path d="M4 12.5l5 5L20 6"/></svg>;
    case 'arrow':   return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'github':  return <svg {...p}><path d="M9 19c-4 1.5-4-2-6-2.5M15 22v-3.5c0-1 .1-1.5-.5-2 3-.3 6-1.5 6-6.5 0-1.3-.5-2.5-1.3-3.4.1-.3.6-1.5-.1-3.2 0 0-1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.9 1 5.9 1.4 5.9 1.4c-.7 1.7-.2 2.9-.1 3.2A5 5 0 0 0 4.5 8c0 5 3 6.2 5.9 6.5-.4.3-.7.9-.8 1.7-1.7.7-3-.4-3.7-1.2"/></svg>;
    case 'spark':   return <svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>;
    case 'box':     return <svg {...p}><path d="M3 8l9-4 9 4-9 4-9-4z"/><path d="M3 8v8l9 4 9-4V8M12 12v8"/></svg>;
    case 'list':    return <svg {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>;
    case 'hand':    return <svg {...p}><path d="M7 11V6a2 2 0 1 1 4 0v5M11 11V4a2 2 0 1 1 4 0v7M15 11V6a2 2 0 1 1 4 0v9a6 6 0 0 1-6 6h-2c-2 0-3-1-4-2l-4-5c-.7-.9-.5-2 .4-2.6.9-.6 2-.4 2.6.4L7 14"/></svg>;
    case 'heart':   return <svg {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>;
    default: return null;
  }
};

// ─────────────────────────────────────────────────────────────
// Tiny SVG decorations
// ─────────────────────────────────────────────────────────────
const HandDrawnUnderline = ({ color, width = 200 }) => (
  <svg width={width} height="14" viewBox={`0 0 ${width} 14`} style={{ display: 'block' }}>
    <path d={`M2 8 Q ${width*0.25} 2, ${width*0.5} 7 T ${width-2} 6`}
      fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity="0.65"/>
  </svg>
);

const Sprout = ({ color, size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <path d="M18 30 V 18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M18 22 C 12 22, 8 18, 8 12 C 14 12, 18 16, 18 22 Z" fill={color} opacity="0.55"/>
    <path d="M18 18 C 24 18, 28 14, 28 8 C 22 8, 18 12, 18 18 Z" fill={color} opacity="0.85"/>
    <path d="M14 30 H 22" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────

function Hero({ c, onPaletteCycle }) {
  return (
    <section style={{
      padding: '40px 24px 64px', maxWidth: 1200, margin: '0 auto',
      position: 'relative',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 80, gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{
          fontFamily: '"DM Sans", sans-serif', fontWeight: 600, fontSize: 20,
          letterSpacing: -0.3, color: c.ink, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{
            width: 10, height: 10, borderRadius: 999, background: c.accent2,
            display: 'inline-block',
          }}/>
          Cataí
        </div>
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center', fontSize: 13,
          color: c.inkSoft,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 999,
            background: c.soft, color: c.ink,
            fontWeight: 500, letterSpacing: 0.2,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: 999, background: c.accent2,
              animation: 'cat-pulse 2.4s ease-in-out infinite',
            }}/>
            em construção
          </span>
          <a href="#ajudar" style={{ color: c.ink, textDecoration: 'none', opacity: 0.7 }}>
            ajudar
          </a>
          <a href="#" style={{ color: c.ink, textDecoration: 'none', opacity: 0.7 }}>
            github
          </a>
        </div>
      </div>

      {/* Hero — single column, centered */}
      <div style={{
        maxWidth: 720, margin: '0 auto',
      }} className="cat-hero-grid">

        {/* Type-led content */}
        <div>
          <div style={{
            fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase',
            color: c.inkSoft, fontWeight: 500, marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ width: 24, height: 1, background: c.rule, display: 'inline-block' }}/>
            recicláveis · catadores · bairro
          </div>

          <h1 style={{
            fontFamily: '"Fraunces", "DM Sans", serif',
            fontSize: 'clamp(56px, 9vw, 132px)',
            lineHeight: 0.92, letterSpacing: -0.04, color: c.ink,
            margin: 0, fontWeight: 400, fontVariationSettings: '"opsz" 144, "SOFT" 50',
          }}>
            Cata<span style={{ fontStyle: 'italic', color: c.accent2 }}>í</span>.
          </h1>

          <p style={{
            fontFamily: '"DM Sans", sans-serif', fontSize: 'clamp(20px, 2.4vw, 26px)',
            lineHeight: 1.35, color: c.ink, maxWidth: 540, marginTop: 28, marginBottom: 0,
            fontWeight: 400, letterSpacing: -0.2,
          }}>
            Recicláveis sem desperdício,<br/>
            catadores <span style={{ position: 'relative', display: 'inline-block' }}>
              sem rota perdida
              <span style={{ position: 'absolute', left: 0, right: -2, bottom: -8 }}>
                <HandDrawnUnderline color={c.accent2} width={260}/>
              </span>
            </span>.
          </p>

          <p style={{
            fontFamily: '"DM Sans", sans-serif', fontSize: 16,
            lineHeight: 1.6, color: c.inkSoft, maxWidth: 480, marginTop: 32,
          }}>
            Um app open-source que conecta quem tem material recicl&aacute;vel a quem coleta.
            Sem pagamento, sem marketplace, sem rastreio. S&oacute; um caminho mais curto entre
            o material e a cooperativa.
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 40, flexWrap: 'wrap' }}>
            <a href="mailto:ola@catai.app?subject=Quero%20ser%20avisado%20quando%20o%20Cata%C3%AD%20lan%C3%A7ar"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '14px 22px', borderRadius: 999,
                background: c.ink, color: c.paper, textDecoration: 'none',
                fontFamily: '"DM Sans", sans-serif', fontSize: 15, fontWeight: 500,
                letterSpacing: -0.1,
                transition: 'transform 0.2s, background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              Quero ser avisado quando lançar
              <Icon name="arrow" size={16} stroke={2}/>
            </a>
            <a href="#" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 22px', borderRadius: 999,
              background: 'transparent', color: c.ink,
              textDecoration: 'none', border: `1.5px solid ${c.rule}`,
              fontFamily: '"DM Sans", sans-serif', fontSize: 15, fontWeight: 500,
            }}>
              <Icon name="github" size={16} stroke={1.8}/>
              Ver o código
            </a>
          </div>

          {/* Charm — tiny line about the name */}
          <div style={{
            marginTop: 56, fontSize: 13, color: c.inkSoft,
            fontFamily: '"DM Sans", sans-serif', letterSpacing: 0.2,
            display: 'flex', alignItems: 'center', gap: 10, opacity: 0.85,
          }}>
            <span style={{ fontStyle: 'italic', fontFamily: '"Fraunces", serif', fontSize: 16 }}>
              cata-í
            </span>
            <span style={{ width: 18, height: 1, background: c.rule }}/>
            <span>cata + aí. quem cata, ali, perto.</span>
          </div>
        </div>

      </div>

      {/* Palette switcher chip — charm detail */}
      <button onClick={onPaletteCycle} style={{
        position: 'absolute', top: 24, right: 24,
        display: 'none',
      }}/>

      <style>{`
        @keyframes cat-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        @media (max-width: 880px) {
          .cat-hero-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// "O que é"
// ─────────────────────────────────────────────────────────────
function WhatIs({ c }) {
  return (
    <section style={{ padding: '80px 24px', borderTop: `1px solid ${c.line}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '180px 1fr', gap: 48,
        }} className="cat-two-col">
          <div style={{
            fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase',
            color: c.inkSoft, fontWeight: 500, paddingTop: 12,
          }}>
            §1 &nbsp; o que é
          </div>
          <div>
            <p style={{
              fontFamily: '"Fraunces", serif', fontSize: 'clamp(22px, 2.6vw, 32px)',
              lineHeight: 1.35, color: c.ink, margin: 0, fontWeight: 400,
              letterSpacing: -0.3, textWrap: 'pretty',
            }}>
              O Cataí é um caminho mais curto entre quem tem material recicl&aacute;vel
              e quem trabalha coletando ele. Um app simples, feito por gente que se
              importa com economia circular e com o trabalho do catador.
            </p>

            <div style={{
              marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32,
            }} className="cat-two-col-inner">
              <div>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: c.accent2,
                  letterSpacing: 0.3, marginBottom: 10,
                }}>
                  o que é
                </div>
                <p style={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: 16,
                  lineHeight: 1.65, color: c.ink, margin: 0, textWrap: 'pretty',
                }}>
                  Um lugar pra estabelecimento publicar, com foto e endere&ccedil;o, que
                  tem material disponível. E um lugar pra catador ver no mapa o que tem
                  pertinho, aceitar, ir buscar.
                </p>
              </div>
              <div>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: c.inkSoft,
                  letterSpacing: 0.3, marginBottom: 10,
                }}>
                  o que não é
                </div>
                <p style={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: 16,
                  lineHeight: 1.65, color: c.ink, margin: 0, opacity: 0.85, textWrap: 'pretty',
                }}>
                  Não é marketplace. Não tem pagamento. Não é app de delivery. Não rastreia
                  ninguém além do mínimo pra mostrar o que está perto. Sem anúncio, sem
                  algoritmo, sem ranking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .cat-two-col { grid-template-columns: 1fr !important; gap: 16px !important; }
          .cat-two-col-inner { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// "Como funciona" — two columns of numbered steps
// ─────────────────────────────────────────────────────────────
function HowItWorks({ c }) {
  const Step = ({ n, title, body }) => (
    <li style={{
      display: 'grid', gridTemplateColumns: '40px 1fr', gap: 16,
      paddingBottom: 24, borderBottom: `1px solid ${c.line}`,
    }}>
      <div style={{
        fontFamily: '"Fraunces", serif', fontSize: 28, color: c.accent2,
        fontWeight: 400, lineHeight: 1, fontStyle: 'italic',
      }}>
        {n}
      </div>
      <div>
        <div style={{
          fontFamily: '"DM Sans", sans-serif', fontSize: 17, fontWeight: 600,
          color: c.ink, marginBottom: 4, letterSpacing: -0.1,
        }}>
          {title}
        </div>
        <div style={{
          fontFamily: '"DM Sans", sans-serif', fontSize: 14.5,
          color: c.inkSoft, lineHeight: 1.55, textWrap: 'pretty',
        }}>
          {body}
        </div>
      </div>
    </li>
  );

  const Column = ({ kind, label, who, steps }) => (
    <div style={{
      padding: 32, borderRadius: 28, background: c.soft,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 160, height: 160, borderRadius: 999,
        background: kind === 'estab' ? c.accent : c.accent2,
        opacity: kind === 'estab' ? 0.45 : 0.18,
      }}/>
      <div style={{
        fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase',
        color: c.inkSoft, fontWeight: 500, position: 'relative',
      }}>
        {label}
      </div>
      <h3 style={{
        fontFamily: '"Fraunces", serif', fontSize: 36, fontWeight: 400,
        color: c.ink, margin: '8px 0 6px', letterSpacing: -0.5,
        position: 'relative',
      }}>
        {who}
      </h3>
      <p style={{
        fontFamily: '"DM Sans", sans-serif', fontSize: 14.5,
        color: c.inkSoft, marginBottom: 36, position: 'relative',
        maxWidth: 360, lineHeight: 1.5,
      }}>
        {kind === 'estab'
          ? 'bar, mercado, restaurante, escritório, lojinha de bairro.'
          : 'profissional que coleta, autônomo ou cooperativado.'}
      </p>

      <ol style={{
        listStyle: 'none', padding: 0, margin: 0, position: 'relative',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {steps.map((s, i) => <Step key={i} n={i + 1} title={s.t} body={s.b}/>)}
      </ol>
    </div>
  );

  return (
    <section style={{ padding: '80px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '180px 1fr', gap: 48,
          marginBottom: 48,
        }} className="cat-two-col">
          <div style={{
            fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase',
            color: c.inkSoft, fontWeight: 500, paddingTop: 12,
          }}>
            §2 &nbsp; como funciona
          </div>
          <h2 style={{
            fontFamily: '"Fraunces", serif', fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 400, letterSpacing: -0.6, color: c.ink, margin: 0,
            lineHeight: 1.05,
          }}>
            Dois lados.<br/>
            <span style={{ fontStyle: 'italic', color: c.accent2 }}>Um caminho curto entre eles.</span>
          </h2>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
          position: 'relative',
        }} className="cat-how-grid">
          {/* connector line — desktop only */}
          <div className="cat-connector" style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 56, height: 56, borderRadius: 999,
            background: c.paper, border: `1.5px solid ${c.rule}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2, color: c.ink,
          }}>
            <Icon name="arrow" size={20} color={c.ink} stroke={1.8}/>
          </div>

          <Column kind="estab" label="perfil A" who="Estabelecimento"
            steps={[
              { t: 'Cria conta com email', b: 'Zero burocracia. Email, senha, nome do lugar. Pronto.' },
              { t: 'Tira foto e descreve', b: 'Aponta a câmera pro material, escreve duas linhas. O endereço já vem do mapa.' },
              { t: 'Catador aceita e busca', b: 'Você recebe o nome de quem aceitou. Combina o horário no chat curto.' },
            ]}/>
          <Column kind="catador" label="perfil B" who="Catador"
            steps={[
              { t: 'Cria conta com email', b: 'Mesmo cadastro simples. Sem documentação obrigatória.' },
              { t: 'Vê no mapa o que tem perto', b: 'Lista das solicitações próximas com foto, endereço e distância.' },
              { t: 'Aceita, coleta, conclui', b: 'Marca como concluída ao final. Histórico fica pra você consultar depois.' },
            ]}/>
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .cat-how-grid { grid-template-columns: 1fr !important; }
          .cat-connector { display: none !important; }
        }
      `}</style>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// "Por que open source"
// ─────────────────────────────────────────────────────────────
function WhyOpenSource({ c }) {
  const values = [
    { k: 'Simplicidade', v: 'O que dá pra fazer com 3 telas, não fazemos com 12.' },
    { k: 'Custo baixo', v: 'Hospedagem barata, dependências mínimas. Pra rodar precisa de pouco.' },
    { k: 'Sem coleta de dados', v: 'Localização só quando o app está aberto. Histórico é seu, fica no seu dispositivo.' },
    { k: 'Comunidade', v: 'Quem usa também opina. Issues abertas, decisões abertas.' },
  ];

  return (
    <section style={{
      padding: '96px 24px', background: c.ink, color: c.paper,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Big watermark numeral */}
      <div style={{
        position: 'absolute', right: -40, top: -60,
        fontFamily: '"Fraunces", serif', fontSize: 480, lineHeight: 1,
        color: c.paper, opacity: 0.05, fontWeight: 400, fontStyle: 'italic',
        pointerEvents: 'none',
      }}>
        §3
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '180px 1fr', gap: 48,
        }} className="cat-two-col">
          <div style={{
            fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase',
            color: c.paper, opacity: 0.6, fontWeight: 500, paddingTop: 12,
          }}>
            §3 &nbsp; open source
          </div>
          <div>
            <h2 style={{
              fontFamily: '"Fraunces", serif', fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 400, letterSpacing: -0.5, margin: 0,
              lineHeight: 1.05, color: c.paper, maxWidth: 720,
            }}>
              Aberto porque{' '}
              <span style={{ fontStyle: 'italic', color: c.accent }}>
                infraestrutura de bairro
              </span>{' '}
              não devia ser de ninguém em particular.
            </h2>

            <p style={{
              fontFamily: '"DM Sans", sans-serif', fontSize: 17,
              lineHeight: 1.6, color: c.paper, opacity: 0.78, margin: '32px 0 0',
              maxWidth: 620, textWrap: 'pretty',
            }}>
              O código é público. Qualquer cooperativa pode rodar a própria instância,
              qualquer cidade pode adaptar o que precisar. A gente prefere assim:
              menos dono, mais útil.
            </p>

            <div style={{
              marginTop: 56,
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px 48px',
            }} className="cat-values-grid">
              {values.map((val, i) => (
                <div key={i} style={{ borderTop: `1px solid ${c.paper}33`, paddingTop: 16 }}>
                  <div style={{
                    fontFamily: '"Fraunces", serif', fontSize: 22,
                    fontWeight: 400, color: c.paper, marginBottom: 6, letterSpacing: -0.2,
                  }}>
                    {val.k}
                  </div>
                  <div style={{
                    fontFamily: '"DM Sans", sans-serif', fontSize: 14.5,
                    color: c.paper, opacity: 0.7, lineHeight: 1.55,
                  }}>
                    {val.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .cat-values-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Status atual — three rows with checkmarks/hourglass
// ─────────────────────────────────────────────────────────────
function Status({ c }) {
  const items = [
    { st: 'pronto', label: 'Backend', desc: 'API, autenticação, lógica de solicitações.' },
    { st: 'wip', label: 'App mobile', desc: 'React Native. Em desenvolvimento ativo.' },
    { st: 'soon', label: 'Beta fechado', desc: 'Em breve. Inscreva-se pra ser avisado.' },
  ];

  // Status dot — three states, all built from the same circle:
  //   pronto: filled solid w/ accent2
  //   wip:    half-filled (left half accent2, right half ring) — feels "in progress"
  //   soon:   ring only (outline)
  const StatusDot = ({ st }) => {
    const size = 22;
    if (st === 'pronto') {
      return (
        <svg width={size} height={size} viewBox="0 0 22 22">
          <circle cx="11" cy="11" r="10" fill={c.accent2}/>
        </svg>
      );
    }
    if (st === 'wip') {
      return (
        <svg width={size} height={size} viewBox="0 0 22 22">
          <circle cx="11" cy="11" r="10" fill="none" stroke={c.accent2} strokeWidth="1.6"/>
          <path d="M11 1 A10 10 0 0 0 11 21 Z" fill={c.accent2}/>
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="10" fill="none" stroke={c.accent2} strokeWidth="1.6" strokeDasharray="3 3"/>
      </svg>
    );
  };
  return (
    <section style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '180px 1fr', gap: 48,
          marginBottom: 48,
        }} className="cat-two-col">
          <div style={{
            fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase',
            color: c.inkSoft, fontWeight: 500, paddingTop: 12,
          }}>
            §4 &nbsp; onde estamos
          </div>
          <h2 style={{
            fontFamily: '"Fraunces", serif', fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 400, letterSpacing: -0.6, color: c.ink, margin: 0,
            lineHeight: 1.05,
          }}>
            Status atual.{' '}
            <span style={{ fontStyle: 'italic', color: c.accent2 }}>Honesto.</span>
          </h2>
        </div>

        <div style={{ marginLeft: 0 }} className="cat-status-list">
          {items.map((it, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr auto',
              gap: 24, alignItems: 'center',
              padding: '28px 0', borderTop: `1px solid ${c.rule}`,
              borderBottom: i === items.length - 1 ? `1px solid ${c.rule}` : 'none',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <StatusDot st={it.st}/>
              </div>
              <div>
                <div style={{
                  fontFamily: '"Fraunces", serif', fontSize: 28, fontWeight: 400,
                  color: c.ink, letterSpacing: -0.3,
                }}>
                  {it.label}
                </div>
                <div style={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: 15,
                  color: c.inkSoft, marginTop: 4, lineHeight: 1.5,
                }}>
                  {it.desc}
                </div>
              </div>
              <div style={{
                fontFamily: '"DM Sans", sans-serif', fontSize: 12,
                color: c.ink, padding: '6px 12px', borderRadius: 999,
                background: it.st === 'pronto' ? c.accent
                  : it.st === 'wip' ? c.soft : 'transparent',
                border: it.st === 'soon' ? `1px dashed ${c.rule}` : 'none',
                fontWeight: 500, letterSpacing: 0.3, textTransform: 'lowercase',
                whiteSpace: 'nowrap',
              }}>
                {it.st === 'pronto' ? 'pronto' : it.st === 'wip' ? 'em andamento' : 'em breve'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Quero ajudar — three profile cards
// ─────────────────────────────────────────────────────────────
// Centralized contribution destinations. Pra trocar URL é só mexer aqui.
// REPO_OWNER/REPO_NAME devem casar com o repositório público no GitHub.
const REPO = 'Gabrielmarlier3/catai';
const ISSUES_BY_LABEL = (label) =>
  `https://github.com/${REPO}/issues?q=is%3Aissue+is%3Aopen+label%3A${encodeURIComponent(label)}`;

const contributionLinks = {
  // Catadores e cooperativas → form em /feedback (Telegram bot via collector).
  collectorsFeedback:        '/feedback?papel=catador',
  cooperativesFeedback:      '/feedback?papel=cooperativa',
  fieldTestsForm:            '/feedback?papel=testes',

  // Designers → issues filtrados por label:design.
  designIssues:              ISSUES_BY_LABEL('design'),

  // Devs → issues marcados como "good first issue".
  devIssues:                 ISSUES_BY_LABEL('good first issue'),

  // Necessidades de design ainda não têm issue específica criada;
  // todas caem na lista filtrada por label:design por enquanto.
  mascotIssue:               ISSUES_BY_LABEL('design'),
  onboardingIssue:           ISSUES_BY_LABEL('design'),
  microcopyIssue:            ISSUES_BY_LABEL('design'),
  collectorSignupFlowIssue:  ISSUES_BY_LABEL('design'),
  uploadErrorIconIssue:      ISSUES_BY_LABEL('design'),
};

function Help({ c }) {
  const cards = [
    {
      kind: 'Catadores',
      title: 'Você que cata',
      body: 'Seu feedback é o que mais importa. Conta o que falta, o que confunde, o que precisa ser diferente. Mesmo sem mexer em código.',
      cta: 'Mandar feedback',
      href: contributionLinks.collectorsFeedback,
      tag: 'feedback',
    },
    {
      kind: 'Designers',
      title: 'Você que desenha',
      body: 'Ilustração leve, fluxos do app, identidade visual, ícones, este aqui que você está lendo. Tem espaço pra muita coisa boa.',
      cta: 'Ver issues de design',
      href: contributionLinks.designIssues,
      tag: 'design',
    },
    {
      kind: 'Devs',
      title: 'Você que programa',
      body: 'Stack: TypeScript, NestJS no backend, React Native no app. Issues marcadas como "good first issue" pra começar tranquilo.',
      cta: 'Ver no GitHub',
      href: contributionLinks.devIssues,
      tag: 'código',
    },
  ];

  const needs = [
    { label: 'ilustração de mascote',          href: contributionLinks.mascotIssue },
    { label: 'tela de onboarding',             href: contributionLinks.onboardingIssue },
    { label: 'testes em campo',                href: contributionLinks.fieldTestsForm },
    { label: 'tradução de microcopy',          href: contributionLinks.microcopyIssue },
    { label: 'fluxo de cadastro do catador',   href: contributionLinks.collectorSignupFlowIssue },
    { label: 'ícone de erro de upload',        href: contributionLinks.uploadErrorIconIssue },
    { label: 'design do email de confirmação', href: contributionLinks.designIssues },
    { label: 'feedback de cooperativas',       href: contributionLinks.cooperativesFeedback },
  ];

  return (
    <section id="ajudar" style={{ padding: '96px 24px', background: c.soft }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '180px 1fr', gap: 48,
          marginBottom: 56,
        }} className="cat-two-col">
          <div style={{
            fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase',
            color: c.inkSoft, fontWeight: 500, paddingTop: 12,
          }}>
            §5 &nbsp; quero ajudar
          </div>
          <div>
            <h2 style={{
              fontFamily: '"Fraunces", serif', fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 400, letterSpacing: -0.6, color: c.ink, margin: 0,
              lineHeight: 1.05, maxWidth: 720,
            }}>
              Tem três jeitos.<br/>
              <span style={{ fontStyle: 'italic', color: c.accent2 }}>Todos contam igual.</span>
            </h2>
            <p style={{
              fontFamily: '"DM Sans", sans-serif', fontSize: 17,
              lineHeight: 1.6, color: c.inkSoft, marginTop: 24, maxWidth: 600,
            }}>
              A gente quer construir isso com calma e com gente que vai usar.
              Quem cata, quem mexe em código, quem desenha. Chega junto.
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
        }} className="cat-help-grid">
          {cards.map((card, i) => (
            <a key={i} href={card.href}
              target={card.href.startsWith('http') ? '_blank' : undefined}
              rel={card.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              style={{
              padding: 28, background: c.paper, borderRadius: 24,
              textDecoration: 'none', display: 'flex', flexDirection: 'column',
              gap: 14, minHeight: 280, position: 'relative',
              border: `1px solid ${c.line}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = `0 12px 32px ${c.ink}11`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{
                fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase',
                color: c.accent2, fontWeight: 600,
              }}>
                {card.kind}
              </div>
              <div style={{
                fontFamily: '"Fraunces", serif', fontSize: 28, fontWeight: 400,
                color: c.ink, letterSpacing: -0.3, lineHeight: 1.1,
              }}>
                {card.title}
              </div>
              <p style={{
                fontFamily: '"DM Sans", sans-serif', fontSize: 14.5,
                color: c.inkSoft, lineHeight: 1.55, margin: 0, flex: 1,
                textWrap: 'pretty',
              }}>
                {card.body}
              </p>
              <div style={{
                marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: '"DM Sans", sans-serif', fontSize: 14,
                color: c.ink, fontWeight: 500, letterSpacing: -0.1,
              }}>
                {card.cta}
                <Icon name="arrow" size={14} stroke={2}/>
              </div>
            </a>
          ))}
        </div>

        {/* Charm — needs list */}
        <div style={{
          marginTop: 56, padding: '32px 0 0',
          borderTop: `1px solid ${c.rule}`,
        }}>
          <div style={{
            fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase',
            color: c.inkSoft, fontWeight: 500, marginBottom: 20,
          }}>
            agora mesmo a gente precisa de
          </div>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8,
            fontFamily: '"DM Sans", sans-serif',
          }}>
            {needs.map((n, i) => (
              <a key={i} href={n.href}
                target={n.href.startsWith('http') ? '_blank' : undefined}
                rel={n.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                style={{
                padding: '6px 14px', borderRadius: 999,
                background: c.paper, fontSize: 13,
                color: c.ink, border: `1px solid ${c.line}`,
                textDecoration: 'none',
                transition: 'transform 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.borderColor = c.accent2;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = c.line;
              }}>
                {n.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .cat-help-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────
function Footer({ c }) {
  return (
    <footer style={{
      padding: '48px 24px 32px', borderTop: `1px solid ${c.line}`,
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
        alignItems: 'flex-end',
      }}>
        <div>
          <div style={{
            fontFamily: '"Fraunces", serif', fontSize: 48, fontWeight: 400,
            color: c.ink, letterSpacing: -0.8, lineHeight: 1,
          }}>
            Cata<span style={{ fontStyle: 'italic', color: c.accent2 }}>í</span>.
          </div>
          <div style={{
            fontFamily: '"DM Sans", sans-serif', fontSize: 13,
            color: c.inkSoft, marginTop: 12, maxWidth: 320, lineHeight: 1.5,
          }}>
            projeto open source sem fins lucrativos. feito com cuidado por uma
            comunidade pequena de gente que se importa.
          </div>
        </div>
        <div style={{
          display: 'flex', gap: 24, alignItems: 'center',
          fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: c.inkSoft,
        }}>
          <a href="#" style={{ color: c.ink, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="github" size={14} stroke={1.8}/> github
          </a>
          <a href="mailto:ola@catai.app" style={{ color: c.ink, textDecoration: 'none' }}>
            ola@catai.app
          </a>
          <span>· {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}

window.CataiSections = { Hero, WhatIs, HowItWorks, WhyOpenSource, Status, Help, Footer, PALETTES, Icon };
