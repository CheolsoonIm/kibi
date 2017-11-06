import _ from 'lodash';

export default function mapSirenJoinProvider(Promise, courier) {
  return function (filter) {
    if (filter.join_sequence) {
      return Promise.resolve({ key: filter.meta.key, value: filter.meta.value });
    }
    return Promise.reject(filter);
  };
};
