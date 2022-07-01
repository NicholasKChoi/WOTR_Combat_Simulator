import cn from 'classnames'

export default function Army({ createArmyUpdater, armyKey }) {
  let unitOptions = [];
  for (let i = 0; i < 10; i ++) {
    unitOptions.push(i);
  }
  return (
    <form className='row small-font-size' noValidate>
      <div className='col-md-4'>
        <label>Regulars</label>
        <select 
          className="form-select"
          onChange={createArmyUpdater(armyKey, "regulars")}>
            {unitOptions.map((item, _)=>{
              return <option key={item} value={item}>{item}</option>
            })}
        </select>
      </div>
      <div className='col-md-4'>
        <label>Elites</label>
        <select
          className="form-select"
          onChange={createArmyUpdater(armyKey, "elites")}>
            {unitOptions.map((item, _)=>{
              return <option key={item} value={item}>{item}</option>
            })}
        </select>
      </div>
      <div className='col-md-4'>
        <label>Leaders</label>
        <select
          className="form-select"
          onChange={createArmyUpdater(armyKey, "leaders")}>
            {unitOptions.map((item, _)=>{
              if (item < 6)
              return <option key={item} value={item}>{item}</option>
            })}
        </select>
      </div>
    </form>
  )
}