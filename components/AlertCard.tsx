type Props = {
  name: string;
  message: string;
  button: string;
  color: string;
};

export default function AlertCard({
  name,
  message,
  button,
  color,
}: Props) {
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
        padding: 18,
        borderRadius: 22,
        marginBottom: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backdropFilter: "blur(12px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      }}
    >
      <div>
        <div style={{ fontWeight: 700 }}>{name}</div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>{message}</div>
      </div>

      <button
        style={{
          background: color,
          border: "none",
          padding: "8px 16px",
          borderRadius: 14,
          color: "white",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        {button}
      </button>
    </div>
  );
}