import { IndexPatternAuthorizationError } from 'ui/errors';
import uiRoutes from 'ui/routes';
import { uiModules } from 'ui/modules';
import _ from 'lodash';
import template from 'plugins/investigate_core/management/sections/kibi_entities/index.html';
import 'plugins/investigate_core/ui/directives/saved_search_nav/saved_search_nav';
import 'plugins/kibana/management/sections/indices/edit_index_pattern/edit_index_pattern';
import 'plugins/investigate_core/management/sections/kibi_entities/styles/entities.less';
import 'plugins/investigate_core/management/sections/indices/index_options/index_options';
import './entity_relations';
import './create_index_pattern';
import './create_eid';
import 'angular-ui-tree';

uiRoutes
.when('/management/siren/indexesandrelations/create/:indexPatternName?', {
  template,
  reloadOnSearch: false,
});

uiRoutes
.when('/management/siren/indexesandrelations/:entityId/:tab?', {
  template: template,
  resolve: {
    selectedEntity: function ($route, courier, Promise, createNotifier, kbnUrl, ontologyClient) {
      const objectId = $route.current.params.entityId;
      return courier.indexPatterns
      .getIds()
      .then((indexPattenrIds) => {
        return ontologyClient.getEntityById(objectId)
        .then((virtualEntity) => {
          if (_.contains(indexPattenrIds, objectId)) {
            return courier.indexPatterns.get(objectId)
            .then((indexPattern) => {
              return _.assign(indexPattern, virtualEntity);
            });
          } else {
            if (virtualEntity) {
              return virtualEntity;
            } else {
              createNotifier().error(`Index pattern ${$route.current.params.entityId} cannot be found`);
              kbnUrl.redirect('/management/siren/indexesandrelations');
              return Promise.halt();
            }
          }
        });
      })
      .catch((error) => {
        if (error instanceof IndexPatternAuthorizationError) {
          createNotifier().warning(`Access to index pattern ${$route.current.params.entityId} is forbidden`);
          kbnUrl.redirect('/management/siren/indexesandrelations');
          return Promise.halt();
        } else {
          return courier.redirectWhenMissing('/management/siren/indexesandrelations')(error);
        }
      });
    },
    activeTab: function ($route) {
      return $route.current.params.tab;
    }
  }
});

uiRoutes
.when('/management/siren/indexesandrelations', {
  template,
  reloadOnSearch: false,
  resolve: {
    redirect: function ($location, kibiDefaultIndexPattern) {
      // kibi: use our service to get default indexPattern
      return kibiDefaultIndexPattern.getDefaultIndexPattern().then(defaultIndex => {
        let path;
        if (defaultIndex.id) {
          path = `/management/siren/indexesandrelations/${defaultIndex.id}`;
        } else {
          path = `/management/siren/indexesandrelations/create/`;
        };
        $location.path(path).replace();
      }).catch(err => {
        const path = '/management/siren/indexesandrelations';
        $location.path(path).replace();
      });
    }
  }
});

uiModules.get('apps/management', ['kibana', 'ui.tree'])
.controller('entities', function ($scope, $route, kbnUrl, createNotifier) {
  $scope.state = { section: 'entity_panel' };
  $scope.indexPattern = $route.current.locals.selectedEntity;

  const notify = createNotifier({
    location: 'Queries Editor'
  });

  $scope.createNewIndexPattern = function () {
    $scope.state.section = 'create_ip';
  };

  if ($route.current.$$route.originalPath.includes('/create/')) {
    $scope.createNewIndexPattern();
  }

  const activeTab = $route.current.locals.activeTab;
  if (activeTab === 'graph' || activeTab === 'details') {
    $scope.headerTab = activeTab;
  }

  $scope.createNewVirtualEntity = function () {
    $scope.state.section = 'create_eid';
  };

  // This function is here to be called in entity_relations.js (as that directive inherits this scope)
  $scope.updateSelectedMenuItem = function (newSelectedMenuItem) {
    $scope.selectedMenuItem = newSelectedMenuItem;
  };

  // Needed until we migrate the panels to use the new generic "entity"
  $scope.$watch('selectedMenuItem.id', (itemId) => {
    if (itemId && (!$route.current.locals.selectedEntity || $route.current.locals.selectedEntity.id !== itemId)) {
      if (activeTab) {
        kbnUrl.change(`/management/siren/indexesandrelations/${itemId}/${activeTab}`);
      } else {
        kbnUrl.change(`/management/siren/indexesandrelations/${itemId}`);
      }
    } else {
      const entity = $route.current.locals.selectedEntity;
      if (entity && (!$scope.entity || $scope.entity.id !== entity.id || $scope.entity.type !== entity.type)) {
        $scope.entity = entity;
        $scope.selectedMenuItem = { id: entity.id, type: entity.type };
      }
    }
  });

  $scope.getHeaderTab = (tabName) => {
    $scope.headerTab = tabName;
  };
});
