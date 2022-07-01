import cn from 'classnames'

export default function Army({ armyKey }) {
  let unitOptions = [];
  for (let i = 0; i < 10; i ++) {
    unitOptions.push(i);
  }
  return (
    <div className='row small-font-size'>
      <div className='col-md-4'>
        <label htmlFor={`${armyKey}-regs`}>Regulars</label>
        <select 
          name={`${armyKey}-regs`}
          className="form-select" >
            {unitOptions.map((item, _)=>{
              return <option 
                key={item} 
                value={item}>{item}</option>
            })}
        </select>
      </div>
      <div className='col-md-4'>
        <label htmlFor={`${armyKey}-elts`}>Elites</label>
        <select
          className="form-select"
          name={`${armyKey}-elts`} >
            {unitOptions.map((item, _)=>{
              return <option key={item} value={item}>{item}</option>
            })}
        </select>
      </div>
      <div className='col-md-4'>
        <label htmlFor={`${armyKey}-ldrs`}>Leaders</label>
        <select
          className="form-select"
          name={`${armyKey}-ldrs`} >
            {unitOptions.map((item, _)=>{
              if (item < 6)
              return <option key={item} value={item}>{item}</option>
            })}
        </select>
      </div>
    </div>
  )
}