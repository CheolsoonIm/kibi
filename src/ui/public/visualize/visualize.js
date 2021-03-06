import 'ui/visualize/spy';
import 'ui/visualize/visualize.less';
import 'ui/visualize/visualize_legend';
import _ from 'lodash';
import { uiModules } from 'ui/modules';
import visualizeTemplate from 'ui/visualize/visualize.html';
import 'angular-sanitize';

import {
  isTermSizeZeroError,
} from '../elasticsearch_errors';

// kibi: imports
import { KibiSpyDataFactory } from 'ui/kibi/spy/kibi_spy_data';

uiModules
.get('kibana/directive', ['ngSanitize'])
.directive('visualize', function ($rootScope, kibiState, createNotifier, SavedVis, indexPatterns, Private, config, $timeout) {
  const notify = createNotifier({
    location: 'Visualize'
  });

  // kibi: to hold onto stats about msearch requests from visualizations like the relational filter
  // This is then displayed in the multisearch spy mode
  const KibiSpyData = Private(KibiSpyDataFactory);

  return {
    restrict: 'E',
    require: '?renderCounter',
    scope : {
      showSpyPanel: '=?',
      vis: '=',
      uiState: '=?',
      searchSource: '=?',
      editableVis: '=?',
      esResp: '=?',
    },
    template: visualizeTemplate,
    link: function ($scope, $el, attr, renderCounter) {
      const minVisChartHeight = 180;

      if (_.isUndefined($scope.showSpyPanel)) {
        $scope.showSpyPanel = true;
      }

      function getter(selector) {
        return function () {
          const $sel = $el.find(selector);
          if ($sel.length) return $sel;
        };
      }

      const getVisEl = getter('[data-visualize-chart]');
      const getVisContainer = getter('[data-visualize-chart-container]');
      const $visContainer = getVisContainer();
      const getSpyContainer = getter('[data-spy-content-container]');

      // Show no results message when isZeroHits is true and it requires search
      $scope.showNoResultsMessage = function () {
        const requiresSearch = _.get($scope, 'vis.type.requiresSearch');
        const isZeroHits = _.get($scope,'esResp.hits.total') === 0;
        const shouldShowMessage = !_.get($scope, 'vis.params.handleNoResults');

        return Boolean(requiresSearch && isZeroHits && shouldShowMessage);
      };

      const legendPositionToVisContainerClassMap = {
        top: 'vis-container--legend-top',
        bottom: 'vis-container--legend-bottom',
        left: 'vis-container--legend-left',
        right: 'vis-container--legend-right',
      };

      $scope.getVisContainerClasses = function () {
        return legendPositionToVisContainerClassMap[$scope.vis.params.legendPosition];
      };

      if (renderCounter && !$scope.vis.implementsRenderComplete()) {
        renderCounter.disable();
      }

      $scope.spy = {};
      $scope.spy.mode = ($scope.uiState) ? $scope.uiState.get('spy.mode', {}) : {};

      // kibi: multisearch spy
      $scope.multiSearchData = null;
      if (_.get($scope, 'vis.type.requiresMultiSearch')) {
        $scope.multiSearchData = new KibiSpyData();
      }
      // kibi: end

      const updateSpy = function () {
        const $visContainer = getVisContainer();
        const $spyEl = getSpyContainer();
        if (!$spyEl) return;

        const fullSpy = ($scope.spy.mode && ($scope.spy.mode.fill || $scope.fullScreenSpy));

        $visContainer.toggleClass('spy-only', Boolean(fullSpy));
        $spyEl.toggleClass('only', Boolean(fullSpy));

        // kibi: skip checking that vis is too small
        if (_.get($scope, 'vis.type.name') === 'kibiqueryviewervis' || _.get($scope, 'vis.type.name') === 'kibi_sequential_join_vis') {
          // for these 2 visualisations
          // buttons are small and query viewer dynamically inject html so at the begining
          // its size is 0;
          return;
        }
        // kibi: end

        $timeout(function () {
          if (shouldHaveFullSpy()) {
            $visContainer.addClass('spy-only');
            $spyEl.addClass('only');
          }
        }, 0);
      };

      // we need to wait for some watchers to fire at least once
      // before we are "ready", this manages that
      const prereq = (function () {
        const fns = [];

        return function register(fn) {
          fns.push(fn);

          return function () {
            fn.apply(this, arguments);

            if (fns.length) {
              _.pull(fns, fn);
              // kibi: let the visualization broadcast this event
              // since it takes care of the searchSource
              if (!fns.length && !_.get($scope, 'vis.type.delegateSearch')) {
                $scope.$root.$broadcast('ready:vis');
              }
            }
          };
        };
      }());

      const loadingDelay = config.get('visualization:loadingDelay');
      $scope.loadingStyle = {
        '-webkit-transition-delay': loadingDelay,
        'transition-delay': loadingDelay
      };

      function shouldHaveFullSpy() {
        const $visEl = getVisEl();
        if (!$visEl) return;

        return ($visEl.height() < minVisChartHeight)
          && _.get($scope.spy, 'mode.fill')
          && _.get($scope.spy, 'mode.name');
      }

      // spy watchers
      $scope.$watch('fullScreenSpy', updateSpy);

      $scope.$watchCollection('spy.mode', function () {
        $scope.fullScreenSpy = shouldHaveFullSpy();
        updateSpy();
      });

      function updateVisAggs() {
        const enabledState = $scope.editableVis.getEnabledState();
        const shouldUpdate = enabledState.aggs.length !== $scope.vis.aggs.length;

        if (shouldUpdate) {
          $scope.vis.setState(enabledState);
          $scope.editableVis.dirty = false;
        }
      }

      $scope.$watch('vis', prereq(function (vis, oldVis) {
        const $visEl = getVisEl();
        if (!$visEl) return;

        if (!attr.editableVis) {
          $scope.editableVis = vis;
        }

        if (oldVis) $scope.renderbot = null;
        if (vis) {
          // kibi: add extra data for the vis
          $scope.renderbot = vis.type.createRenderbot(vis, $visEl, $scope.uiState, $scope.multiSearchData, $scope.searchSource);
        }

        // kibi: associate the vis with the searchSource
        if ($scope.searchSource) {
          $scope.searchSource.vis = $scope.vis;
        }
        // kibi: end
      }));

      $scope.$watchCollection('vis.params', prereq(function () {
        updateVisAggs();
        if ($scope.renderbot) $scope.renderbot.updateParams();
      }));

      // kibi: if delegateSearch is true, the visualization takes care of retrieving the results.
      // kibi: if the visualization does not require a search do not trigger a query
      if (!_.get($scope, 'vis.type.delegateSearch') && _.get($scope, 'vis.type.requiresSearch')) {
        $scope.$watch('searchSource', prereq(function (searchSource) {
          if (!searchSource || attr.esResp) return;

          // TODO: we need to have some way to clean up result requests
          searchSource.onResults().then(function onResults(resp) {
            if ($scope.searchSource !== searchSource) return;

            //kibi: delete error on searchSource
            delete searchSource.error;
            // kibi: end

            $scope.esResp = resp;

            return searchSource.onResults().then(onResults);
          }).catch(notify.fatal);

          searchSource.onError(e => {
            $el.trigger('renderComplete');
            if (isTermSizeZeroError(e)) {
              return notify.error(
                `Your visualization ('${$scope.vis.title}') has an error: it has a term ` +
                `aggregation with a size of 0. Please set it to a number greater than 0 to resolve ` +
                `the error.`
              );
            }
            // kibi: notify only if it is NOT a missing index error
            if (_.get(e, 'resp.error.type') === 'index_not_found_exception') {
              searchSource.error =
              (e.resp.error.reason && e.resp.error['resource.id']) ?
              e.resp.error.reason + ' ' + e.resp.error['resource.id'] :
              'Index not found';
            } else {
              return notify.error(e);
            }
          }).catch(notify.fatal);
        }));
      }

      $scope.$watch('esResp', prereq(function (resp) {
        if (!resp) return;
        // kibi: This is needed by multichart to stop re-render es responses
        //       can be used too to change the response before render process take place
        if ($scope.vis.esResponseAdapter) {
          $scope.renderbot.render($scope.vis.esResponseAdapter(resp));
          return;
        }
        // kibi: end
        $scope.renderbot.render(resp);
      }));

      $scope.$watch('renderbot', function (newRenderbot, oldRenderbot) {
        if (oldRenderbot && newRenderbot !== oldRenderbot) {
          oldRenderbot.destroy();
        }
      });

      // kibi: these are required for fixed header in kibi enhanced table
      // watch visualization resize and pass 'visResized' event to table_header.js
      $scope.$watch(
        function () {
          return {
            width: $el.width(),
            height: $el.height(),
          };
        },
       function (newValue, oldValue) {
         if(newValue === oldValue) {
           return;
         }

         const columns = $scope.vis.params.columns;
         const visLeftOffset = $el.offset().left;
         const visWidth = $el.width();

         $rootScope.$broadcast('visResized', visLeftOffset, visWidth, columns);
       },
       true
    );

      // listen scroll event in visualization and pass 'visScrolled' event to table_header.js
      $visContainer.on('scroll', function () {
        const columns = $scope.vis.params.columns;
        const visTopOffset = $el.offset().top;
        const visLeftOffset = $el.offset().left;
        const visWidth = $el.width();
        $rootScope.$broadcast('visScrolled', visTopOffset, visLeftOffset, visWidth, columns);
      });
      // kibi: end

      $scope.$on('$destroy', function () {
        if ($scope.renderbot) {
          $el.off('renderComplete');
          $scope.renderbot.destroy();
        }
      });
    }
  };
});
