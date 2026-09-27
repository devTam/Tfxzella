import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZE, pageCount } from "@/lib/pagination";

export function Pagination({ page, total, pageSize = PAGE_SIZE }: { page: number; total: number; pageSize?: number }) {
  const pages = pageCount(total, pageSize);
  const href = (next: number) => `?page=${next}`;
  const first = total ? (page - 1) * pageSize + 1 : 0, last = Math.min(page * pageSize, total);
  return <nav className="pagination" aria-label="Table pagination">
    <span>{first.toLocaleString()}–{last.toLocaleString()} of {total.toLocaleString()}</span>
    <div>
      {page > 1 ? <Link className="icon-btn" href={href(page - 1)} aria-label="Previous page"><ChevronLeft size={16}/></Link> : <span className="icon-btn disabled"><ChevronLeft size={16}/></span>}
      <b>Page {page.toLocaleString()} of {pages.toLocaleString()}</b>
      {page < pages ? <Link className="icon-btn" href={href(page + 1)} aria-label="Next page"><ChevronRight size={16}/></Link> : <span className="icon-btn disabled"><ChevronRight size={16}/></span>}
    </div>
  </nav>;
}
