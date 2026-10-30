const OUTCOME_LABELS = {
  attacker: "Attacker wins",
  defender: "Defender wins",
  tie: "Tie",
};

const SIDES = [
  { key: "attacker", label: "Attack", armyType: "Shadow", field: "attack" },
  { key: "defender", label: "Defense", armyType: "Free", field: "defend" },
];

function percent(frequency) {
  return `${(100 * frequency).toFixed(1)}%`;
}

function SurvivorTable({ label, survivors }) {
  return (
    <table className="table table-striped">
      <caption className="caption-top">{label}</caption>
      <thead>
        <tr>
          <th scope="col">Regs</th>
          <th scope="col">Elites</th>
          <th scope="col">Count</th>
          <th scope="col">% of Wins</th>
        </tr>
      </thead>
      <tbody>
        {survivors.length === 0 ? (
          <tr>
            <td colSpan={4}>no wins</td>
          </tr>
        ) : survivors.map(({ regulars, elites, count, frequency }) => (
          <tr key={`${regulars},${elites}`}>
            <td>{regulars}</td>
            <td>{elites}</td>
            <td>{count}</td>
            <td>{percent(frequency)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * @param submitted - the form values posted for this fight
 * @param summary - the /api/fight response
 */
export default function Results({ submitted, summary }) {
  const { battles, outcomes, rounds, survivors, hitsPerRound } = summary;
  const meanRounds = Math.round(rounds.mean * 100) / 100;

  return (
    <div className="row">
      <div className="col">
        <h4 className="border-bottom border-light">
          Army Results
        </h4>
        <table className="table table-striped">
          <thead>
            <tr>
              <th scope="col">Pos.</th>
              <th scope="col">Army Type</th>
              <th scope="col">Regs</th>
              <th scope="col">Elites</th>
              <th scope="col">Leaders</th>
            </tr>
          </thead>
          <tbody>
            {SIDES.map(({ key, label, armyType, field }) => (
              <tr key={key}>
                <th scope="row">{label}</th>
                <td>{armyType}</td>
                <td>{submitted[`${field}-regs`]}</td>
                <td>{submitted[`${field}-elts`]}</td>
                <td>{submitted[`${field}-ldrs`]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>Battles: {battles}</p>
        <h4 className="border-bottom border-light">
          Fighting Stats
        </h4>
        <table className="table table-striped">
          <thead>
            <tr>
              <th scope="col">Outcome</th>
              <th scope="col">Count</th>
              <th scope="col">Percent</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(outcomes).map(([kind, { count, frequency }]) => (
              <tr key={kind}>
                <th scope="row">{OUTCOME_LABELS[kind] ?? kind}</th>
                <td>{count}</td>
                <td>{percent(frequency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="table table-striped">
          <caption className="caption-top">Rounds per battle</caption>
          <thead>
            <tr>
              <th scope="col">Mean</th>
              <th scope="col">Median</th>
              <th scope="col">p10</th>
              <th scope="col">p90</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{meanRounds}</td>
              <td>{rounds.median}</td>
              <td>{rounds.p10}</td>
              <td>{rounds.p90}</td>
            </tr>
          </tbody>
        </table>
        <h4 className="border-bottom border-light">
          Surviving Units
        </h4>
        {SIDES.map(({ key, label }) => (
          <SurvivorTable key={key} label={label} survivors={survivors[key]} />
        ))}
        <h4 className="border-bottom border-light">
          Hits per Round
        </h4>
        <table className="table table-striped">
          <thead>
            <tr>
              <th scope="col">Hits</th>
              <th scope="col">Attack</th>
              <th scope="col">Defense</th>
            </tr>
          </thead>
          <tbody>
            {hitsPerRound.attacker.map((share, hits) => (
              <tr key={hits}>
                <th scope="row">{hits}</th>
                <td>{percent(share)}</td>
                <td>{percent(hitsPerRound.defender[hits])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
