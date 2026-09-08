export const X_HANDLE = 'PixelDividend'
export const X_URL = `https://x.com/${X_HANDLE}`

interface Props {
  /** 'full' shows the handle beside the mark; 'compact' is the mark alone. */
  variant?: 'full' | 'compact'
  className?: string
}

/**
 * Link to the project's X account. Defined once so the landing screen and the
 * app header cannot drift apart on the handle or the styling.
 */
export function XLink({ variant = 'full', className = '' }: Props) {
  return (
    <a
      className={`xlink${variant === 'compact' ? ' compact' : ''}${className ? ` ${className}` : ''}`}
      href={X_URL}
      target="_blank"
      rel="me noopener noreferrer"
      aria-label={`Pixel Dividend on X, @${X_HANDLE}`}
    >
      <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        />
      </svg>
      {variant === 'full' && <span>@{X_HANDLE}</span>}
    </a>
  )
}
