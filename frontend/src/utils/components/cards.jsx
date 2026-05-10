const isRenderable = (value) => value !== undefined && value !== null && value !== ''

function DataCard({
  title,
  subtitle,
  tag,
  fields = [],
  actions = [],
  footer,
  children,
  className = '',
  onClick,
}) {
  const cardClassName = ['data-card', className].filter(Boolean).join(' ')
  const isInteractive = typeof onClick === 'function'

  const handleKeyDown = (event) => {
    if (!isInteractive) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick(event)
    }
  }

  return (
    <article
      className={cardClassName}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      {(isRenderable(title) || isRenderable(subtitle) || isRenderable(tag)) && (
        <header className="data-card__header">
          <div className="data-card__title-group">
            {isRenderable(title) && <h3 className="data-card__title">{title}</h3>}
            {isRenderable(subtitle) && <p className="data-card__subtitle">{subtitle}</p>}
          </div>
          {isRenderable(tag) && <span className="data-card__tag">{tag}</span>}
        </header>
      )}

      {fields.length > 0 && (
        <dl className="data-card__fields">
          {fields.map(({ label, value, renderValue, key }) => {
            if (!isRenderable(value) && typeof renderValue !== 'function') {
              return null
            }

            return (
              <div className="data-card__field" key={key ?? label}>
                <dt className="data-card__label">{label}</dt>
                <dd className="data-card__value">
                  {typeof renderValue === 'function' ? renderValue(value) : value}
                </dd>
              </div>
            )
          })}
        </dl>
      )}

      {children}

      {actions.length > 0 && (
        <div className="data-card__actions">
          {actions.map(({ label, onAction, type = 'button', disabled = false, key }) => (
            <button
              className="data-card__action"
              disabled={disabled}
              key={key ?? label}
              onClick={onAction}
              type={type}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {footer}
    </article>
  )
}

export default DataCard
