import "./Button.css";

export const Button = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) => {
  return (
    <div onClick={onClick} className="button">
      {children}
    </div>
  );
};
