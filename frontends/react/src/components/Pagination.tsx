interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <ul className="pagination">
      <li className={`page-item${page === 1 ? ' disabled' : ''}`}>
        <button
          type="button"
          className="page-link"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          &laquo; Previous
        </button>
      </li>
      {pages.map((n) => (
        <li key={n} className={`page-item${page === n ? ' active' : ''}`}>
          <button type="button" className="page-link" onClick={() => onPageChange(n)}>
            {n}
          </button>
        </li>
      ))}
      <li className={`page-item${page === totalPages ? ' disabled' : ''}`}>
        <button
          type="button"
          className="page-link"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next &raquo;
        </button>
      </li>
    </ul>
  );
}
