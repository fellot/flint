'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, ChevronDown, FileText, Loader2, Paperclip, Search, Send, ShoppingBag, Sparkles, X } from 'lucide-react';
import { CELLAR_ESSENTIALS, type GuideCategory } from '@/data/cellar-essentials';
import { getShoppingGaps } from '@/lib/cellar-shopping';
import { readResponse } from '@/lib/client-api';
import type { ShoppingAttachment, ShoppingBrief, ShoppingReply } from '@/types/shopping';
import { readShoppingPdf } from '@/lib/shopping-attachment';
import type { Wine } from '@/types/wine';
import './cellar-shopping.css';

interface Props {
  wines: Wine[]; cellarId: string; cellarName: string;
  locale: 'en' | 'pt'; loading: boolean; error: boolean;
}
type Turn = { id: number; user: string; attachmentName?: string; reply?: ShoppingReply; error?: string };
const emptyBrief: ShoppingBrief = { market: '', retailers: '', budget: '' };
const categories: [GuideCategory | 'all', string, string][] = [
  ['all', 'All styles', 'Todos os estilos'], ['red', 'Reds', 'Tintos'], ['white', 'Whites', 'Brancos'],
  ['sparkling', 'Sparkling', 'Espumantes'], ['rose', 'Rosé', 'Rosés'], ['fortified', 'Dry fortified', 'Fortificados secos'], ['sweet', 'Sweet', 'Doces'],
];

export default function CellarEssentialsShopping({ wines, cellarId, cellarName, locale, loading, error }: Props) {
  const pt = locale === 'pt';
  const [brief, setBrief] = useState<ShoppingBrief>({ ...emptyBrief });
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const [attachment, setAttachment] = useState<ShoppingAttachment | null>(null);
  const [readingPdf, setReadingPdf] = useState(false);
  const [attachmentError, setAttachmentError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const fileReadId = useRef(0);
  const [category, setCategory] = useState<GuideCategory | 'all'>('all');
  const coverage = useRef<HTMLDetailsElement>(null);
  const [scope, setScope] = useState<'gaps' | 'explore' | 'restock' | 'covered'>('gaps');
  const controller = useRef<AbortController | null>(null);
  const turnId = useRef(0);
  const replyHeading = useRef<HTMLHeadingElement>(null);
  const available = !loading && !error;
  const gaps = useMemo(() => getShoppingGaps(wines), [wines]);
  const counts = (status: string) => gaps.filter(g => g.status === status).length;
  const visible = gaps.filter(g => (category === 'all' || g.category === category)
    && (scope === 'gaps' ? g.status !== 'covered' : g.status === scope));
  const latest = [...turns].reverse().find(t => t.reply)?.reply;
  const latestGapStatus = new Map(gaps.map(g => [g.id, g.status]));

  useEffect(() => () => { controller.current?.abort(); fileReadId.current++; }, []);

  async function attachPdf(file?: File) {
    if (!file || pending || readingPdf) return;
    const id = ++fileReadId.current;
    setReadingPdf(true); setAttachmentError('');
    try {
      const pdf = await readShoppingPdf(file);
      if (fileReadId.current === id) setAttachment(pdf);
    } catch (e) {
      if (fileReadId.current === id) setAttachmentError(pt ? 'Escolha um PDF completo de até 3 MB. Se necessário, exporte apenas as páginas desejadas.' : e instanceof Error ? e.message : 'Could not attach this PDF.');
    } finally { if (fileReadId.current === id) setReadingPdf(false); }
  }

  async function send(message: string) {
    const content = message.trim() || (attachment ? (pt ? 'Quais vinhos desta lista em PDF você recomenda para minha adega e meu paladar? Explique suas escolhas.' : 'Which wines from this PDF list would you recommend for my cellar and palate? Explain your choices.') : '');
    if (!content || controller.current || !available || readingPdf) return;
    const currentController = new AbortController();
    controller.current = currentController;
    const id = ++turnId.current;
    const previous = turns.filter(t => t.reply);
    const messages = [...previous.map(t => ({ role: 'user', content: t.user })), { role: 'user', content }].slice(-12);
    setTurns(current => [...current, { id, user: content, attachmentName: attachment?.name }]);
    setDraft(''); setPending(true);
    const timeout = setTimeout(() => currentController.abort('timeout'), 110000);
    try {
      const response = await fetch('/api/ai/shopping', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: currentController.signal,
        body: JSON.stringify({ cellarId, messages, brief,
          attachment,
          previousDocumentPicks: attachment && latest?.documentName === attachment.name ? latest.documentPicks?.map(p => ({ name: p.name, page: p.page })) || [] : [],
          previousProducts: latest?.products.map(p => ({ name: p.name, url: p.url })) || [] }),
      });
      const reply = await readResponse<ShoppingReply>(response);
      if (reply.cellarId !== cellarId || !Array.isArray(reply.products)) throw new Error(pt ? 'A pesquisa não corresponde à adega selecionada.' : 'The research does not match the selected cellar.');
      if (currentController.signal.aborted) return;
      setBrief(reply.brief);
      setTurns(current => current.map(t => t.id === id ? { ...t, reply } : t));
      // Keep page scrolling natural; keyboard/screen-reader users can find the new reply.
      requestAnimationFrame(() => replyHeading.current?.focus({ preventScroll: true }));
    } catch (e) {
      const message = currentController.signal.aborted
        ? (pt ? 'Pesquisa interrompida. Você pode tentar novamente.' : 'Research stopped. You can try again.')
        : e instanceof Error ? e.message : (pt ? 'Não foi possível pesquisar.' : 'Could not complete the research.');
      setTurns(current => current.map(t => t.id === id ? { ...t, error: message } : t));
      setDraft(content);
    } finally {
      clearTimeout(timeout);
      if (controller.current === currentController) { controller.current = null; setPending(false); }
    }
  }

  const starters = [
    pt ? 'Quais são as principais lacunas desta adega?' : 'What are the biggest gaps in this cellar?',
    pt ? 'Encontre três tintos para preencher as lacunas.' : 'Find three reds to fill the gaps.',
    pt ? 'Quero começar uma adega pequena e variada.' : 'Help me start a small, varied cellar.',
  ];
  const date = (s: string) => new Intl.DateTimeFormat(pt ? 'pt-BR' : 'en-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(s));
  const money = (amount: number, currency: string) => {
    try { return new Intl.NumberFormat(pt ? 'pt-BR' : 'en-CA', { style: 'currency', currency, currencyDisplay: 'code' }).format(amount); }
    catch { return `${currency} ${amount.toFixed(2)}`; }
  };

  return <section className="essentials-shopping cellar-buyer" aria-labelledby="shopping-heading">
    <header className="shopping-heading">
      <div><p className="eyebrow">{pt ? 'A PRÓXIMA GARRAFA' : 'THE NEXT BOTTLE'} · {cellarName}</p><h2 id="shopping-heading">{pt ? 'Uma adega com a sua assinatura.' : 'A cellar with your signature.'}</h2>
        <p>{pt ? 'Descubra o que falta, diga onde você compra e encontre garrafas que acrescentam algo à sua coleção.' : 'Discover what’s missing, tell me where you shop, and find bottles that bring something new to your collection.'}</p></div>
      <div className="shopping-edition"><ShoppingBag size={19} strokeWidth={1.4} /><strong>{available ? counts('explore') + counts('restock') : '—'}</strong><span>{pt ? 'estilos fora do estoque' : 'styles absent from stock'}</span></div>
    </header>

    {!available ? <p className="buyer-notice" role="status">{loading ? (pt ? 'Consultando esta adega…' : 'Checking this cellar…') : (pt ? 'Não é possível identificar lacunas enquanto o estoque estiver indisponível. Tente carregar seus vinhos novamente.' : 'Gaps cannot be identified while inventory is unavailable. Reload your wines to continue.')}</p> : <>
      <div className="buyer-overview" aria-label={pt ? 'Cobertura desta adega' : 'Coverage of this cellar'}>
        <button onClick={() => { setScope('covered'); if (coverage.current) coverage.current.open = true; }} aria-pressed={scope === 'covered'}><strong>{counts('covered')}</strong><span>{pt ? 'estilos na adega' : 'styles in cellar'}</span></button>
        <button onClick={() => { setScope('explore'); if (coverage.current) coverage.current.open = true; }} aria-pressed={scope === 'explore'}><strong>{counts('explore')}</strong><span>{pt ? 'sem correspondência' : 'without a match'}</span></button>
        <button onClick={() => { setScope('restock'); if (coverage.current) coverage.current.open = true; }} aria-pressed={scope === 'restock'}><strong>{counts('restock')}</strong><span>{pt ? 'no diário, fora do estoque' : 'tasted, no longer stocked'}</span></button>
        <button onClick={() => { setScope('gaps'); if (coverage.current) coverage.current.open = true; }} aria-pressed={scope === 'gaps'}><Search size={18} /><span>{pt ? 'Ver oportunidades' : 'See opportunities'}</span></button>
      </div>
      <details ref={coverage} className="buyer-coverage">
        <summary>{pt ? 'O mapa da sua coleção' : 'Your collection at a glance'}<span>{pt ? 'Todos os fundamentais' : 'All Essentials'}</span><ChevronDown size={16} /></summary>
        <div className="buyer-gap-filters"><label>{pt ? 'Tipo de vinho' : 'Wine type'}<select value={category} onChange={e => setCategory(e.target.value as typeof category)}>{categories.map(([id, en, br]) => <option key={id} value={id}>{pt ? br : en}</option>)}</select></label><p>{pt ? 'Correspondências conservadoras: dados incompletos podem ocultar um estilo que você já tem. Os doces são opcionais.' : 'Matches use recorded wine details; incomplete records can hide a style you already own. Sweet styles are optional.'}</p></div>
        <ul className="buyer-gap-list">{visible.map(g => <li key={g.id}><div><strong>{g.name[locale]}</strong><span>{g.status === 'covered' ? (pt ? 'Na adega' : 'In cellar') : g.status === 'restock' ? (pt ? 'Já provado · fora do estoque' : 'Tasted · absent from stock') : g.status === 'review' ? (pt ? 'Conferir composição do corte' : 'Check blend composition') : (pt ? 'Sem correspondência no estoque ou diário' : 'No match in stock or journal')}</span></div>{['explore', 'restock'].includes(g.status) && <button disabled={pending} onClick={() => void send(pt ? `Vamos explorar opções de ${g.name.pt} para esta adega.` : `Let’s explore ${g.name.en} options for this cellar.`)} aria-label={`${pt ? 'Pesquisar' : 'Research'} ${g.name[locale]}`}><ArrowUpRight size={16} /></button>}{g.status === 'covered' && <Check size={15} />}</li>)}</ul>
        {!visible.length && <p className="buyer-notice">{pt ? 'Nenhum estilo nesta seleção.' : 'No styles in this selection.'}</p>}
      </details>
    </>}

    <div className="buyer-conversation">
      <header className="buyer-intro"><span className="buyer-monogram"><Sparkles size={22} strokeWidth={1.2} /></span><div><h3>{pt ? 'Seu comprador de vinhos.' : 'Your wine buyer.'}</h3><p>{pt ? 'Da lacuna à garrafa certa. Vamos conversar.' : 'From a missing style to the right bottle. Let’s talk.'}</p></div><Link href="/my-palate">{pt ? 'Meu paladar' : 'My palate'}<ArrowUpRight size={13} /></Link></header>
      <p className="buyer-context-note">{pt ? `Esta conversa é para ${cellarName}. Usa o estoque atual e suas preferências pessoais; começa do zero ao mudar de adega ou recarregar.` : `This conversation belongs to ${cellarName}. It uses current stock and your personal preferences; it starts fresh when you switch cellars or reload.`}</p>
      <div className="buyer-brief"><label>{pt ? 'Onde você compra?' : 'Where do you shop?'}<input value={brief.market} onChange={e => setBrief(b => ({ ...b, market: e.target.value }))} maxLength={160} disabled={pending} placeholder={pt ? 'País, região ou cidade' : 'Country, region or city'} /></label><label>{pt ? 'Lojas preferidas · opcional' : 'Preferred retailers · optional'}<input value={brief.retailers} onChange={e => setBrief(b => ({ ...b, retailers: e.target.value }))} maxLength={240} disabled={pending} placeholder={pt ? 'Ex.: LCBO + Cellar Collection' : 'e.g. LCBO + Cellar Collection'} /></label><label>{pt ? 'Orçamento · opcional' : 'Budget · optional'}<input value={brief.budget} onChange={e => setBrief(b => ({ ...b, budget: e.target.value }))} maxLength={160} disabled={pending} placeholder={pt ? 'Por garrafa e moeda, ou sem limite' : 'Per bottle and currency, or no limit'} /></label></div>
      {!turns.length && <div className="buyer-starters">{starters.map(s => <button key={s} disabled={!available || pending} onClick={() => void send(s)}>{s}<ArrowUpRight size={14} /></button>)}</div>}
      <div className="buyer-transcript" aria-label={pt ? 'Conversa de compras' : 'Shopping conversation'}>
        {turns.map((turn, index) => <article className="buyer-turn" key={turn.id}>
          <p className="buyer-user"><span>{pt ? 'Você' : 'You'}</span>{turn.user}{turn.attachmentName && <small className="buyer-turn-attachment"><FileText size={13} />{turn.attachmentName}</small>}</p>
          {turn.error && <p className="buyer-notice buyer-error" role="alert">{turn.error}</p>}
          {turn.reply && <div className="buyer-answer"><h4 tabIndex={-1} ref={index === turns.length - 1 ? replyHeading : undefined}>{pt ? 'O sommelier sugere' : 'From your sommelier'}{turn.reply.searched && <small>{pt ? 'Pesquisa de' : 'Researched'} {date(turn.reply.checkedAt)}</small>}</h4><p className="buyer-prose">{turn.reply.answer}</p>
            {!!turn.reply.documentPicks?.length && <section className="buyer-document-results" aria-label={pt ? 'Sugestões da lista em PDF' : 'Suggestions from your PDF list'}>
              <p className="buyer-document-heading"><FileText size={16} /><span>{pt ? 'DA SUA LISTA EM PDF' : 'FROM YOUR PDF LIST'}<small>{turn.reply.documentName}</small></span></p>
              <p className="buyer-context-note">{pt ? 'Preços e ofertas conforme o documento. Estoque atual não verificado. As páginas indicam a posição no PDF.' : 'Prices and offers as printed in the document. Current stock has not been checked. Page numbers refer to the PDF page order.'}</p>
              <div className="buyer-products">{turn.reply.documentPicks.map((p, pickIndex) => <article className="buyer-product buyer-document-product" key={`${p.name}:${p.vintage}:${p.page}`}>
                <p className="eyebrow">{String(pickIndex + 1).padStart(2, '0')} · {CELLAR_ESSENTIALS.find(e => e.id === p.essentialId)?.name[locale]}</p>
                <h5>{p.name}</h5><p className="buyer-product-meta">{p.vintage ?? (pt ? 'Safra não confirmada / NV' : 'Vintage unconfirmed / NV')}{p.retailer ? ` · ${p.retailer}` : ''}{p.size ? ` · ${p.size}` : ''}</p>
                <p>{p.reason}</p><div className="buyer-price"><strong>{p.price !== null && p.currency ? money(p.price, p.currency) : (pt ? 'Preço não confirmado' : 'Price unconfirmed')}</strong><span>{pt ? 'Preço no PDF' : 'PDF price'}</span></div>
                <details><summary>{pt ? 'Detalhes da lista e quando beber' : 'List details & when to drink'}<ChevronDown size={13} /></summary><p>{p.evidence}</p>{p.drinkingGuidance && <p>{p.drinkingGuidance}</p>}</details>
                <p className="buyer-pdf-citation"><FileText size={13} />{turn.reply?.documentName} · {pt ? 'pág.' : 'p.'} {p.page}</p>
              </article>)}</div>
            </section>}
            {turn.reply.products.length > 0 && <div className="buyer-products">{turn.reply.products.map(p => {
              const style = CELLAR_ESSENTIALS.find(e => e.id === p.essentialId)!;
              const nowCovered = latestGapStatus.get(p.essentialId) === 'covered';
              return <article className="buyer-product" key={p.url}><p className="eyebrow">{style.name[locale]}{nowCovered ? (pt ? ' · Agora na adega' : ' · Now in cellar') : ''}</p><h5><a href={p.url} target="_blank" rel="noopener noreferrer">{p.name}<ArrowUpRight size={14} /></a></h5><p className="buyer-product-meta">{p.vintage ?? (pt ? 'Safra não confirmada / NV' : 'Vintage unconfirmed / NV')} · {p.retailer}{p.size ? ` · ${p.size}` : ''}</p><p>{p.reason}</p><div className="buyer-price"><strong>{p.price !== null && p.currency ? money(p.price, p.currency) : (pt ? 'Preço não confirmado' : 'Price unconfirmed')}</strong><span className={`buyer-stock buyer-stock-${p.availability}`}>{p.availability === 'available' ? (pt ? 'Disponível na pesquisa' : 'Available at research') : p.availability === 'unavailable' ? (pt ? 'Indisponível na pesquisa' : 'Unavailable at research') : (pt ? 'Estoque não confirmado' : 'Stock unconfirmed')}</span></div><p className="buyer-product-note">{p.availabilityNote}</p><details><summary>{pt ? 'Por que esta opção?' : 'About this option'}<ChevronDown size={13} /></summary><p>{p.evidence}</p>{p.drinkingGuidance && <p>{p.drinkingGuidance}</p>}</details><a className="buyer-retailer" href={p.url} target="_blank" rel="noopener noreferrer">{pt ? 'Conferir no vendedor' : 'Check retailer'}<ArrowUpRight size={14} /></a></article>;
            })}</div>}
            {turn.reply.omitted > 0 && <p className="buyer-notice">{pt ? 'Algumas opções foram removidas porque não foi possível validar a fonte, o estilo, a lacuna ou a compatibilidade com seu paladar.' : 'Some options were omitted because their source, style, cellar gap or fit with your palate could not be validated.'}</p>}
            {turn.reply.searched && !turn.reply.products.length && <p className="buyer-notice">{pt ? 'Nenhuma opção de compra validada nesta pesquisa.' : 'No validated purchase options in this search.'}</p>}
            {turn.reply.sources.length > 0 && <details className="buyer-sources"><summary>{pt ? 'Fontes da pesquisa' : 'Research sources'}<ChevronDown size={13} /></summary><ul>{turn.reply.sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}<ArrowUpRight size={12} /></a></li>)}</ul></details>}
            {turn.reply.question && <p className="buyer-question">{turn.reply.question}</p>}
          </div>}
        </article>)}
      </div>
      {pending && <div className="buyer-progress" role="status"><Loader2 size={16} className="buyer-spinner" /><span>{pt ? 'Consultando sua adega e preparando a resposta. Pesquisas online podem levar cerca de um minuto…' : 'Reviewing your cellar and preparing a reply. Online research can take about a minute…'}</span><button onClick={() => controller.current?.abort()}>{pt ? 'Parar' : 'Stop'}</button></div>}
      <div className="buyer-attachment-controls">
        <input ref={fileInput} type="file" accept="application/pdf,.pdf" aria-label={pt ? 'Anexar lista de vinhos em PDF' : 'Attach PDF wine list'} hidden onChange={e => { void attachPdf(e.target.files?.[0]); e.target.value = ''; }} />
        <button className="buyer-attach" type="button" disabled={!available || pending || readingPdf} onClick={() => fileInput.current?.click()}>{readingPdf ? <Loader2 size={15} className="buyer-spinner" /> : <Paperclip size={15} />}{readingPdf ? (pt ? 'Preparando PDF…' : 'Preparing PDF…') : attachment ? (pt ? 'Trocar PDF' : 'Replace PDF') : (pt ? 'Anexar lista em PDF' : 'Attach PDF wine list')}</button>
        <span>{pt ? 'Um PDF · até 3 MB' : 'One PDF · up to 3 MB'}</span>
      </div>
      {attachment && <div className="buyer-attachment" role="status"><FileText size={22} /><div><strong>{attachment.name}</strong><small>{pt ? 'Será usado nesta conversa até você remover.' : 'Used for this conversation until you remove it.'}</small></div><button type="button" disabled={pending || readingPdf} aria-label={pt ? 'Remover PDF' : 'Remove PDF'} onClick={() => { setAttachment(null); setAttachmentError(''); }}><X size={16} /></button></div>}
      {attachmentError && <p className="buyer-notice buyer-error" role="alert">{attachmentError}</p>}
      <p className="buyer-context-note">{pt ? 'Enquanto anexado, o PDF é enviado à OpenAI com cada mensagem. Ele não é salvo na adega. Recarregar ou iniciar outra conversa remove o anexo deste chat.' : 'While attached, the PDF is sent to OpenAI with each message. It is not saved in your cellar. Reloading or starting fresh clears the attachment from this chat.'}</p>
      <form className="buyer-compose" onSubmit={e => { e.preventDefault(); void send(draft); }}><label className="sr-only" htmlFor="buyer-message">{pt ? 'Mensagem para o comprador' : 'Message your wine buyer'}</label><textarea id="buyer-message" value={draft} onChange={e => setDraft(e.target.value)} maxLength={2000} rows={2} disabled={!available || pending} placeholder={attachment ? (pt ? 'O que vale a pena comprar desta lista? (opcional)' : 'What is worth buying from this list? (optional)') : (pt ? 'Encontre brancos secos para as lacunas. Quero beber neste ano…' : 'Find dry whites for my gaps. I’d like to drink them this year…')} /><button className="flint-button" disabled={!available || pending || readingPdf || (!draft.trim() && !attachment)} type="submit"><Send size={15} />{pt ? 'Enviar' : 'Send'}</button></form>
      <footer className="buyer-footer"><p>{pt ? 'Preços, safras e estoque podem mudar. Confirme no vendedor. As sugestões não compram nem adicionam garrafas ao estoque.' : 'Prices, vintages and stock can change. Confirm with the retailer. Suggestions never purchase or add bottles to your stock.'}</p>{(turns.length > 0 || attachment) && <button disabled={pending || readingPdf} onClick={() => { setTurns([]); setDraft(''); setBrief({ ...emptyBrief }); setAttachment(null); setAttachmentError(''); }}><X size={13} />{pt ? 'Nova conversa' : 'Start fresh'}</button>}</footer>
    </div>
  </section>;
}
