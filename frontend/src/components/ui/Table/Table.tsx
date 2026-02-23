import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  rowKey?: (row: T, index: number) => string | number;
}

function Table<T>({
  columns,
  data,
  onRowClick,
  rowKey,
}: TableProps<T>) {
  const { t } = useTranslation();

  return (
    <div className="w-full overflow-x-auto bg-white border border-border rounded-lg">
      <table className="w-full border-collapse font-primary text-dense-table leading-[1.5]">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-medium-gray font-semibold text-caption text-left uppercase tracking-[0.5px] py-[10px] px-lg border-b-2 border-border whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-medium-gray py-3xl px-lg text-body">
                {t('common.noData')}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowKey ? rowKey(row, rowIndex) : rowIndex}
                className={clsx(
                  'bg-white min-h-[44px] transition-colors duration-150 ease-in-out hover:bg-surface-hover',
                  '[&:not(:last-child)>td]:border-b [&:not(:last-child)>td]:border-border-light',
                  onRowClick && 'cursor-pointer',
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="py-md px-lg text-black text-dense-table font-normal align-middle"
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export { Table };
