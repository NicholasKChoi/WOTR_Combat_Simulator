import utilStyles from '../../styles/utils.module.css';


import cn from "classnames";
import Head from "next/head";
import Image from 'next/image';
import Layout from "../../components/layout";

const pageTitle = 'Starcraft Helper';

export default function StarcraftHelper() {
  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <section className={cn(utilStyles.headingMd, "container")}>
        <h1>{pageTitle}</h1>
        <div className='row mb-2 pb-3 border-bottom border-info'>
        <div className='col-6'>
          <div className='card'>
            <h5 className='card-header'>Fighter Select</h5>
            <div className="card-body">
              <h5 className="card-title">Select Fighers</h5>
              <p className="card-text fs-6">
                Two fighters will randomly be selected each time you 
                click the button below! 
              </p>
              <a className="btn btn-primary">Randomize</a>
            </div>
          </div> 
        </div>
        </div>
      </section>
    </Layout> 
  );
}