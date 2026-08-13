export function ErrorMessage({ message }) {
  if (!message) return null
  return (
    <p className="error" role="alert">
      {message}
    </p>
  )
}
