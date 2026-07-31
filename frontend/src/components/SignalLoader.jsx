function SignalLoader({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div className="signal-loader">
        <span className="signal-ring signal-ring-1" />
        <span className="signal-ring signal-ring-2" />
        <span className="signal-ring signal-ring-3" />
        <span className="signal-dot" />
      </div>
      {text && <p style={{ color: "#888", fontSize: "14px" }}>{text}</p>}
    </div>
  );
}

export default SignalLoader;
