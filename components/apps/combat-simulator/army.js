import { useState } from 'react';
import cn from 'classnames'

const MAX_FIGHTERS = 10;
const MAX_LEADERS = 5;

function countOptions(max) {
  return Array.from({ length: max + 1 }, (_, i) => i);
}

export default function Army({ armyKey }) {
  const [regulars, setRegulars] = useState(0);
  const [elites, setElites] = useState(0);
  const fighterOptions = countOptions(MAX_FIGHTERS);
  const leaderOptions = countOptions(MAX_LEADERS);
  return (
    <div className='row small-font-size'>
      <div className='col-md-4'>
        <label htmlFor={`${armyKey}-regs`}>Regulars</label>
        <select
          name={`${armyKey}-regs`}
          className="form-select"
          value={regulars}
          onChange={(e) => setRegulars(Number(e.target.value))} >
            {fighterOptions.map((item, _)=>{
              return <option
                key={item}
                value={item}
                disabled={item + elites > MAX_FIGHTERS}>{item}</option>
            })}
        </select>
      </div>
      <div className='col-md-4'>
        <label htmlFor={`${armyKey}-elts`}>Elites</label>
        <select
          className="form-select"
          name={`${armyKey}-elts`}
          value={elites}
          onChange={(e) => setElites(Number(e.target.value))} >
            {fighterOptions.map((item, _)=>{
              return <option
                key={item}
                value={item}
                disabled={regulars + item > MAX_FIGHTERS}>{item}</option>
            })}
        </select>
      </div>
      <div className='col-md-4'>
        <label htmlFor={`${armyKey}-ldrs`}>Leaders</label>
        <select
          className="form-select"
          name={`${armyKey}-ldrs`} >
            {leaderOptions.map((item, _)=>{
              return <option key={item} value={item}>{item}</option>
            })}
        </select>
      </div>
    </div>
  )
}
