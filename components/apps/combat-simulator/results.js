
/**
 * 
 * @param {attackers, defenders} props - should map to pages/api/fight.ts result
 * @returns 
 */
export default function Results({ attackers, defenders }) {

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
              <td>{attackers.regulars}</td>
              <td>{attackers.elites}</td>
              <td>{attackers.leaders}</td>
            </tr>
            <tr>
              <th scope="row">Defense</th>
              <td>Free</td>
              <td>{defenders.regulars}</td>
              <td>{defenders.elites}</td>
              <td>{defenders.leaders}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}