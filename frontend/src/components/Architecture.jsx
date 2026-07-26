function Architecture() {
  return (
    <section className="architecture" id="architecture">

      <p className="section-tag">
        HOW IT WORKS
      </p>

      <h2>
        From market data
        <br />
        to AI intelligence
      </h2>

      <div className="architecture-flow">

        <div className="flow-box">
          <span>📊</span>
          <h3>Market Data</h3>
          <p>CoinGecko & other data sources</p>
        </div>

        <div className="flow-arrow">↓</div>

        <div className="flow-box">
          <span>🧠</span>
          <h3>Intelligence Engine</h3>
          <p>SignalMint analyzes market conditions</p>
        </div>

        <div className="flow-arrow">↓</div>

        <div className="flow-box">
          <span>🤖</span>
          <h3>AI Analysis</h3>
          <p>Generate insights and recommendations</p>
        </div>

        <div className="flow-arrow">↓</div>

        <div className="flow-box">
          <span>📄</span>
          <h3>Professional Report</h3>
          <p>Easy-to-read reports for investors</p>
        </div>

      </div>

    </section>
  );
}

export default Architecture;