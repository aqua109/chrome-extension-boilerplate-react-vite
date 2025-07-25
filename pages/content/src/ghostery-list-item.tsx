import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import { GhosteryMatch } from './ghostery-tracking-response';

type GhosteryListItemProps = {
  match: GhosteryMatch;
  count: number;
  colour: string;
};

const Item = styled(Paper, { shouldForwardProp: prop => prop !== 'sx' })(({ theme }) => ({
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

const GetFlagEmoji = (countryCode: string) => {
  let codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const GhosteryListItem = (props: GhosteryListItemProps) => {
  return (
    <Item sx={{ borderLeft: `5px solid ${props.colour}` }}>
      <div className="match-pattern-name">
        {props.match.pattern.name} {props.count > 1 ? `(${props.count})` : ''}
      </div>
      <div className="match-category-name">{props.match.category?.name}</div>
      <div className="match-category-desc">{props.match.category?.description}</div>

      {(props.match.organization?.name ?? false) && (
        <>
          <br></br>
          <div className="match-org-name">
            {props.match.organization?.name}{' '}
            {props.match.organization?.country != null && GetFlagEmoji(props.match.organization?.country)}
          </div>
        </>
      )}

      {(props.match.organization?.description ?? false) && (
        <>
          <div className="match-org-desc">{props.match.organization?.description}</div>
        </>
      )}

      {(props.match.organization?.website_url ?? false) && (
        <>
          <a href={props.match.organization?.website_url} className="matchOrgSite">
            Website
          </a>
          <br></br>
        </>
      )}

      {(props.match.organization?.privacy_policy_url ?? false) && (
        <>
          <a href={props.match.organization?.privacy_policy_url} className="matchOrgSite">
            Privacy Policy
          </a>
        </>
      )}
    </Item>
  );
};

export default GhosteryListItem;
