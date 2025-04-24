import { Chart } from 'react-google-charts';

type GhosteryMatchesData = {
  data: (string | number)[][];
};

const PieGraph = (/*props: GhosteryMatchesData*/) => {
  const data = [
    ['Task', 'Hours per Day'],
    ['Work', 9],
    ['Eat', 2],
    ['Commute', 2],
    ['Watch TV', 2],
    ['Sleep', 7],
  ];

  const options = {
    title: 'My Daily Activities',
  };
  return <Chart chartType="PieChart" data={data} options={options} width={'100%'} height={'400px'} />;
};

export default PieGraph;
