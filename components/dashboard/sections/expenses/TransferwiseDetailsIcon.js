import React from 'react';
import { Info } from '@styled-icons/feather/Info';

import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import StyledTooltip from '../../../StyledTooltip';

export const BalancesBreakdown = ({ balances }) => {
  return (
    <div>
      {balances.map(({ valueInCents, currency }) => (
        <React.Fragment key={currency}>
          {currency}:&nbsp;
          <FormattedMoneyAmount
            amount={valueInCents}
            currency={currency}
            amountClassName="text-white font-bold"
            showCurrencyCode={false}
          />
          <br />
        </React.Fragment>
      ))}
    </div>
  );
};

const TransferwiseDetailsIcon = ({ size, balances }) => {
  if (!balances || balances.length < 2) {
    return null;
  } else {
    return (
      <StyledTooltip content={() => <BalancesBreakdown balances={balances} />}>
        <Info size={size} color="#76777A" />
      </StyledTooltip>
    );
  }
};

export default TransferwiseDetailsIcon;
