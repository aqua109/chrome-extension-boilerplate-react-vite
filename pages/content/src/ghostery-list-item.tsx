import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import { GhosteryMatch } from './ghostery-tracking-response';

type GhosteryListItemProps = {
  match: GhosteryMatch;
  count: number;
};

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'left',
  color: theme.palette.text.secondary,
  flexGrow: 1,
  ...theme.applyStyles('dark', {
    backgroundColor: '#1A2027',
  }),
}));

const GhosteryListItem = (props: GhosteryListItemProps) => {
  return (
    <Item>
      <div className="match-pattern-name">
        {props.match.pattern.name} {props.count > 1 ? `(${props.count})` : ''}
      </div>
      <div className="match-category-name">{props.match.category?.name}</div>
      <div className="match-category-desc">{props.match.category?.description}</div>
      <br></br>
      <div className="match-org-name">{props.match.organization?.name}</div>
      <div className="match-org-desc">{props.match.organization?.description}</div>
      <div className="match-org-country">Based in: {props.match.organization?.country}</div>
      <a href={props.match.organization?.website_url} className="matchOrgSite">
        Website
      </a>
      <br></br>
      <a href={props.match.organization?.privacy_policy_url} className="matchOrgSite">
        Privacy Policy
      </a>
    </Item>
  );
};

export default GhosteryListItem;
