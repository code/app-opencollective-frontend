import React from 'react';
import { defineMessage, FormattedMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterConfig } from '../../../lib/filters/filter-types';
import { ExpectedFundsFilter } from '../../../lib/graphql/types/v2/schema';

import ComboSelectFilter from './ComboSelectFilter';

const schema = z.nativeEnum(ExpectedFundsFilter).optional().nullish().default(ExpectedFundsFilter.ALL_EXPECTED_FUNDS);

export const expectedFundsFilter: FilterConfig<z.infer<typeof schema>> = {
  schema: schema,
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Created by', id: 'Agreement.createdBy' }),
    Component: ({ valueRenderer, intl, ...props }) => {
      const options = React.useMemo(
        () => Object.values(ExpectedFundsFilter).map(value => ({ label: valueRenderer({ intl, value }), value })),
        [intl, valueRenderer],
      );
      return <ComboSelectFilter isMulti={false} options={options} {...props} />;
    },
    valueRenderer: ({ value }) =>
      value === ExpectedFundsFilter.ALL_EXPECTED_FUNDS ? (
        <FormattedMessage defaultMessage="Anyone" id="TFJD82" />
      ) : value === ExpectedFundsFilter.ONLY_PENDING ? (
        <FormattedMessage defaultMessage="Host Admin" id="oaDOlQ" />
      ) : (
        <FormattedMessage defaultMessage="Contributors" id="Contributors" />
      ),
  },
};
