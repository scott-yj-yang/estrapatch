interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export default function Card({ children, className = "", title }: CardProps) {
  return (
    <div
      className={`bg-white rounded-kawaii shadow-kawaii p-4 ${className}`}
    >
      {title && (
        <h3 className="text-kawaii-pink-dark font-bold mb-3">{title}</h3>
      )}
      {children}
    </div>
  );
}
