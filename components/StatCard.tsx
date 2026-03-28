type Props = {
  label: string;
  value: string | number;
};

export default function StatCard({ label, value }: Props) {
  return (
    <div
      style={{
        flex: 1,
        padding: "20px 16px",
        borderRadius: 20,
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))",
        border: "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(10px)",
        textAlign: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      }}
    >
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          marginBottom: 6,
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: 11,
          letterSpacing: 1,
          opacity: 0.6,
        }}
      >
        {label}
      </div>
    </div>
  );
}