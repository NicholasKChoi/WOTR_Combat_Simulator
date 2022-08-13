


/**
 * 
 * @param {attack, defend} props - should map to pages/api/fight.ts result
 * @returns 
 */
export default function Results({
    attack,
    defend,
    averageAttackHitsPerRound,
    averageDefendHitsPerRound,
    survivor
  }) {
  averageAttackHitsPerRound = Math.round(averageAttackHitsPerRound * 100) / 100;
  averageDefendHitsPerRound = Math.round(averageDefendHitsPerRound * 100) / 100;

  return (
    <div className="row">
      <div className="col">
        <h4 className="border-bottom border-light">
          Army Results
        </h4>
        <table className="table table-striped">
          <thead>
            <th scope="col">Pos.</th>
            <th scope="col">Army Type</th>
            <th scope="col">Regs</th>
            <th scope="col">Elites</th>
            <th scope="col">Leaders</th>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Attack</th>
              <td>Shadow</td>
              <td>{attack.regulars}</td>
              <td>{attack.elites}</td>
              <td>{attack.leaders}</td>
            </tr>
            <tr>
              <th scope="row">Defense</th>
              <td>Free</td>
              <td>{defend.regulars}</td>
              <td>{defend.elites}</td>
              <td>{defend.leaders}</td>
            </tr>
          </tbody>
        </table>
        <h4 className="border-bottom border-light">
          Fighting Stats
        </h4>
        <table className="table table-striped">
          <thead>
            <th scope="col">Name</th>
            <th scope="col">Value</th>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Survivor</th>
              <td>{survivor}</td>
            </tr>
            <tr>
              <th scope="row">Attack Hits</th>
              <td>{averageAttackHitsPerRound}</td>
            </tr>
            <tr>
              <th scope="row">Defend Hits</th>
              <td>{averageDefendHitsPerRound}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}