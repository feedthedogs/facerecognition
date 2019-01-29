(function (OC, window, $, undefined) {
'use strict';

$(document).ready(function () {

/*
 * Faces in memory handlers.
 */
var Persons = function (baseUrl) {
    this._baseUrl = baseUrl;
    this._persons = [];
    this._loaded = false;
};

Persons.prototype = {
    loadPersons: function () {
        var deferred = $.Deferred();
        var self = this;
        $.get(this._baseUrl+'/persons').done(function (clusters) {
            self._persons = clusters;
            self._loaded = true;
            deferred.resolve();
        }).fail(function () {
            deferred.reject();
        });
        return deferred.promise();
    },
    isLoaded: function () {
        return this._loaded;
    },
    sortBySize: function () {
        this._persons.sort(function(a, b) {
            return b.faces.length - a.faces.length;
        });
    },
    getAll: function () {
        return this._persons;
    },
    rename: function (personId, personName) {
        var self = this;
        var deferred = $.Deferred();
        var opt = { name: personName };
        $.ajax({url: this._baseUrl + '/person/' + personId,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(opt)
        }).done(function (data) {
            self._persons.forEach(function (person) {
                if (person.id === personId) {
                    person.name = personName;
                }
            });
            deferred.resolve();
        }).fail(function () {
            deferred.reject();
        });
        return deferred.promise();
    }
};

/*
 * View.
 */
var View = function (persons) {
    this._persons = persons;
};

View.prototype = {
    reload: function (name) {
        var self = this;
        this._persons.loadPersons().done(function () {
            self.render();
        }).fail(function () {
            alert('D\'Oh!. Could not reload faces..');
        });
    },
    renderContent: function () {
        var source = $('#content-tpl').html();
        var template = Handlebars.compile(source);

        this._persons.sortBySize();

        var html = template({
            loaded: this._persons.isLoaded(),
            persons: this._persons.getAll(),
        });

        $('#div-content').html(html);

        const observer = lozad('.face-preview');
        observer.observe();

        var self = this;

        /*
         * User interaction callbacks.
         */

        $('#enableFacerecognition').on('click', function () {
            var enabled = 'false';
            if ($('#enableFacerecognition').prop('checked')) {
                enabled = 'true';
            }

            $.ajax({
                type: 'GET',
                url: OC.generateUrl('apps/facerecognition/setvalue'),
                data: {
                    'type': 'enabled',
                    'value': enabled
                },
                success: function () {
                    if (enabled) {
                        OC.Notification.showTemporary(t('facerecognition', 'The analysis is enabled, please be patient, you will soon see your friends here.'));
                    } else {
                        OC.Notification.showTemporary(t('facerecognition', 'The analysis is disabled, we eliminate all information for the recognition of your friends.'));
                    }
                }
            });
        });

        $('#facerecognition .icon-rename').click(function () {
            var id = $(this).parent().data('id');
            OC.dialogs.prompt(
                t('facerecognition', 'Please enter a name to rename the person'),
                t('facerecognition', 'Rename Person'),
                function(result, value) {
                    if (result === true && value) {
                        self._persons.rename (id, value).done(function () {
                            self.renderContent();
                        }).fail(function () {
                            alert('D\'Oh!. Could not rename your friend..');
                        });
                    }
                },
                true,
                t('facerecognition', 'Rename'),
                false
            ).then(function() {
                var $dialog = $('.oc-dialog:visible');
                var $buttons = $dialog.find('button');
                $buttons.eq(0).text(t('facerecognition', 'Cancel'));
                $buttons.eq(1).text(t('facerecognition', 'Rename'));
            });
        });
    }
};

/*
 * Main app.
 */
var persons = new Persons(OC.generateUrl('/apps/facerecognition'));

var view = new View(persons);

view.renderContent();

persons.loadPersons().done(function () {
    view.renderContent();
}).fail(function () {
    alert('D\'Oh!. Could not load faces..');
});


}); // $(document).ready(function () {
})(OC, window, jQuery); // (function (OC, window, $, undefined) {