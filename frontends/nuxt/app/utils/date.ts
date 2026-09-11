const formatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

export function formatDate(dateStr: string): string {
  return formatter.format(new Date(dateStr))
}
