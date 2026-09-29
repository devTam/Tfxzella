export default function Loading(){
  return <div className="content route-loading" role="status" aria-live="polite"><div className="loading-head"><span className="skeleton skeleton-short"/><span className="skeleton skeleton-title"/><span className="skeleton skeleton-copy"/></div><div className="loading-grid">{Array.from({length:6},(_,index)=><div className="card loading-card" key={index}><span className="skeleton skeleton-short"/><span className="skeleton skeleton-value"/></div>)}</div><span className="sr-only">Loading page</span></div>;
}
