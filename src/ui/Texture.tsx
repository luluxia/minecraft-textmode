export function Texture({ src, name = '', className = '' }: { src: string; name?: string; className?: string }) {
  return <img className={`texture ${className}`} src={`${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`} alt={name} width={24} height={24} loading="lazy" />
}
