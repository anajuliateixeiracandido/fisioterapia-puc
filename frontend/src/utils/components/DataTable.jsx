import './DataTable.css'

const normalizePrimitiveValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean' ? item : '',
      )
      .filter(Boolean)
      .join(', ') || '-'
  }

  return '-'
}

const getCellValue = (row, column) => {
  if (typeof column.render === 'function') {
    return column.render(row)
  }

  if (!column.accessor) {
    return '-'
  }

  const value = row[column.accessor]
  return normalizePrimitiveValue(value)
}

function DataTable({
  columns = [],
  data = [],
  rowKey = 'id',
  emptyMessage = 'Nenhum registro encontrado.',
  className = '',
}) {
  const tableClassName = ['data-table', className].filter(Boolean).join(' ')

  return (
    <div className="data-table-wrapper">
      <table className={tableClassName}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.id ?? column.accessor ?? column.header}
                className={column.headerClassName ?? ''}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 && (
            <tr>
              <td className="data-table__empty" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          )}

          {data.map((row, index) => (
            <tr key={typeof rowKey === 'function' ? rowKey(row) : row[rowKey] ?? index}>
              {columns.map((column) => (
                <td
                  key={column.id ?? column.accessor ?? column.header}
                  className={column.cellClassName ?? ''}
                >
                  {getCellValue(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
