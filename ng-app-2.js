myApp = angular.module('timer', [])

.filter('stringify', function() {
    return function(val) {
        var args=[], v;
        val = +val;
        args[0] = Math.floor(val/3600);
        args[1] = Math.floor((val - args[0]*3600)/60);
        args[2] = val - args[0]*3600 - args[1]*60;
        for(var i=0; i<3; i++){
            v = args[i];
            args[i] = (v<0) ? "00" : (v<10 ? "0"+v: v);
        }
        return args.join(':');
    }
})
.controller('PlayerCtrl', function ($scope, myService) {
    $scope.$on('play', function(event, track) {
        myService.play(track);
    });
    $scope.$on('pause', function(event) {
        myService.stop();
    });
})

.factory('myService', function($document, $timeout){
    var groups = [{data:"work", label:" -- Work -- "},
                {data:"rest", label:" -- Rest -- "},
                {data:"testing", label:" -- Test -- "},
                {data:"new", label:"New preset"}],

        times = [{group:'work', label:'00 - 45 - 00', id:'0'},
                {group:'work', label:'01 - 00 - 00', id:'1'},
                {group:'work', label:'01 - 15 - 00', id:'2'},
                {group:'work', label:'01 - 30 - 00', id:'3'},
                {group:'rest', label:'00 - 10 - 00', id:'4'},
                {group:'rest', label:'00 - 15 - 00', id:'5'},
                {group:'rest', label:'00 - 20 - 00', id:'6'},
                {group:'rest', label:'00 - 30 - 00', id:'7'},
                {group:'testing', label:'00 - 00 - 05', id:'8'},
                {group:'testing', label:'00 - 00 - 01', id:'9'}
        ]

        var audioEl = $document[0].querySelector('audio');
        var getDate = function(){
            return new Date();
        }

        var getGroups = function(){
            return groups
        };

        var getIntervals = function(){
            return times
        }
        Hisory = {}

    return {
        play: function(track){
            audioEl.src = track;
            $timeout(function(){
                audioEl.play();
            }, 1000)
        },
        stop: function(){
            audioEl.pause();
            audioEl.initialTime = 0;
        },
        getGroups: getGroups,
        getIntervals: getIntervals,

        getDefaultPreset: function(key){
            var pstDefaultValue = parseInt(localStorage.getItem('timer' + key+ '.preset'));
            return pstDefaultValue;
        },
        getStorageInfo: function(timer){
            var History = localStorage.getItem('timer'  + timer.ix +'_'+jName+ '.history');
            History = (History!=null) ? angular.fromJson(History) : {};
            return History;
        },
        saveStats: function(timer, stopped) {
            var date = getDate().toString().match(/ ([A-z]{3} \d{2})/)[1],
                storedInfo = angular.fromJson(localStorage.getItem('timer'  + timer.ix +'_'+jName + '.history')) || {},
                val = (stopped) ? timer.initVals - timer.time : timer.initValue,

                Date = History[date] = (storedInfo[date]==null) ? {} : storedInfo[date];
            Date[val] = (Date[val]==null) ? 1 : ++Date[val];

            localStorage.setItem('timer' + timer.ix +'_'+jName + '.history', angular.toJson(History));
            localStorage.setItem('timer' + timer.ix +'_'+jName + '.runs', '' + timer.numOfRuns);
            if(timer.total>0)
                localStorage.setItem('timer'+timer.ix+'_'+jName +'.total', ''+timer.total);
        }
    }
})


.controller('TimerCtrl', ['$scope', '$rootScope', 'myService', '$timeout',
    function($scope, $rootScope, myService, $timeout){
    $scope.keepTime = true;
    $scope.continuous = true;
    $scope.launched = false;
    $scope.showInfo = false;

    $scope.Tgroups = myService.getGroups();
    $scope.Ttimes = myService.getIntervals();
    $scope.Timers=[]

    $scope.defaultPresets = [0, 1];
    $scope.Prefs = {timeBeforeNotification: 1, delayBeforeFine:3}
    $scope.newJob = {title:'', descr:''};


    audioDefaults = [0, 0];
    $scope.audio = ["BlueZedEx.mp3", "BlueZedEx.mp3"];

	$scope.jobs = [{label:'Mine', descr:'',total:0}, {label:'JWT', total:0}];

    jobLoaded = false;
        prev=''

    function init(currentJob){
        History = {};

        var j = !!currentJob ?  currentJob : $scope.jobs[0];

        jName = $scope.jName = j.label
        $scope.Timers[jName]=[{},{}];

        angular.forEach($scope.Timers[j.label], function(timer, key){
            var pstDefaultValue = myService.getDefaultPreset(key);
            angular.extend(timer, {
                ix: key,
                jobDescr: j.descr || j.label,

                details: [],
                total: parseInt(localStorage.getItem('timer'+key+'_'+jName +'.total')) || 0,
                numOfRuns: parseInt(localStorage.getItem('timer'+key+'_'+jName +'.runs')) || 0,

                selectedGroup: $scope.Tgroups[key],
                presetSelected:  key==0
                    ? ( $scope.Ttimes[pstDefaultValue] || $scope.Ttimes[1])
                    : ($scope.Ttimes[pstDefaultValue] || $scope.Ttimes[5]),
                track: $scope.audio[audioDefaults[key]],

                mode: 'stopped',
                time:0,
                blink: false
            })
            $scope.getSelectedPreset(timer);

            if(localStorage.getItem('timer'+key+'.preset')==null)
                localStorage.setItem('timer'+key+'.preset', ''+ key==0 ? $scope.Ttimes[1].id : $scope.Ttimes[5].id);
        })

        if(typeof currentJob=='undefined')
            retrieveJobs()

        var goHome = setInterval(function(){
            var now = new Date();
            if(now.toString().match(/ (\d\d:\d\d)/)[1]=='18:29'){
                clearTimeout(goHome);
                alert('It\'s time to go home');
            }
        }, 0.5*60*1000);
    }

    $scope.goToSelected = function( gotoJob ){
        if(gotoJob.label==prev)
            return

        init(gotoJob);

        $scope.currentJob = gotoJob

        prev = gotoJob.label
    }
    $scope.add = function( newjob ){
        findUnique(newjob)

        init($scope.jobs[1])
        $scope.currentJob = $scope.jobs[1];

        done();
    }
    $scope.remove = function(){
        if(confirm('You\'re going to delete '+currJob.label))
            angular.forEach($scope.jobs, function(v, k){
                if(v.label==currJob.label){
                    delete $scope.jobs[k];
                    return;
                }
            })
        $scope.currentJob = $scope.jobs[1];
        done()
    }
    $scope.cancel = function(){
        done();
    }

    $scope.showOptions = function(){
        $('#jobForm').animate({top: '0px'}, 400);
    }

    $scope.$watch('newJob', function(val){
        if(val.title.length < 4){
            $scope.jobForm.title.$setValidity(false);
            $scope.disabled = true;
        }else{
            $scope.jobForm.title.$setValidity(true);
            $scope.disabled = false;
        }
    })
    $scope.$watch('continuous', function(newVal) {
        $scope.continuous = newVal;
    })

    $scope.run = function (timer){
        if(timer.mode=='running')
            return;

        timer.mode = 'running';
        timer.initValue = timer.presetSelected.label.replace(/ /g, '');

        go = setInterval(function(){
            var currTime = timer.time - 1;
            pump(timer, currTime);

            if(currTime==0){
                clearTimeout(go);
                timer.numOfRuns++;

                myService.saveStats(timer, false);

                if(!$scope.continuous) {
                    $scope.stop(timer);//first -- pause
                    $scope.stop(timer)
                }
                notify("Timer is over", "Notification", timer);
            }
        }, 1000)
    };

    $scope.stop = function (timer){

        if( timer.mode=='stopped')
            return;

        clearTimeout(go);

        if(timer.mode=='paused'){
            timer.mode = 'stopped';
            timer.total += timer.initVals - timer.time;
            timer.numOfRuns ++;

            myService.saveStats(timer, true);

            timer.time = timer.initVals;
            return;
        }
        if(timer.mode!='paused')
            timer.mode = 'paused';
    };


//    $scope.showDatailed = function(timer){
//         History = myService.getStorageInfo(timer);
//         angular.forEach(History, function(day, date){
//             summary = 0;
//             angular.forEach(History[date], function(nums, val){
//                 summary += timeStringToVal(val.replace(/-/g, ' - '))
//             })
//             History[date].summary = summary;
//         })
//         $scope.showInfo = true;
//         $scope.info = History;
//     };

    $scope.getSelectedGroup = function(timer){
        var gr = timer.selectedGroup.data;
        var pstDefaultValue = myService.getDefaultPreset(timer.ix);

        if(gr=='work')
            timer.presetSelected = $scope.Ttimes[pstDefaultValue];
        if(gr=='rest')
            timer.presetSelected = $scope.Ttimes[pstDefaultValue];

        $scope.getSelectedPreset(timer)
    }

    $scope.getSelectedPreset = function(timer){
        if(timer.mode=='running'){
            alert('to change initial values first pause timer')
            return;
        }
            var presetTime = timeStringToVal(timer.presetSelected.label);

            if(timer.mode=='paused' && timer.initVals!=timer.time){
                if(confirm('Apply elapsed time to new time?')){
                    delta = timer.initVals - timer.time;
                    if(delta>0) {
                        timer.initVals = presetTime;
                        timer.time = timer.initVals - delta;
                    }
                }
            }else{
                timer.time = presetTime;
                timer.initVals = presetTime
            }
    }

    function done(){
        $('#jobForm').animate({top: '-400px'}, 400)

        $scope.newJob.title = '';
        $scope.newJob.descr = '';
        $scope.jobForm.title.$setValidity(true);
    }

    function retrieveJobs(){
        for(var key in localStorage){
            var item = localStorage[key];
            if( /timer\d_.+\.runs/.test(key) && !/_Mine/.test(key) )
                $scope.jobs.splice(1, 0, {label:key.match(/.+_([^\.]+)/)[1]})
        }
    }

    function findUnique (newjob){
        var newjob = newjob ||  $scope.jobs[0]
        jobs=[]
        angular.forEach($scope.jobs, function(v, k){
            jobs.push(v.label)
        })

        if( jobs.join().indexOf(newjob.title)==-1 ){
            var newJob = {label:newjob.title, descr:newjob.descr}
            $scope.jobs.splice(1, 0, newJob)
        }
    }

    function timeStringToVal(str) {
        var sTime = str.split(' - ');
        var presetTime = parseInt(sTime[0]) * 3600 + parseInt(sTime[1] * 60) + parseInt(sTime[2]);
        return presetTime;
    }

    function notify(msg, title, Timer){

        var initTime = new Date();

        vibrate(msg, title);
        $rootScope.$broadcast('play', Timer.track);

        $timeout(function(){
            $rootScope.$broadcast('pause');

            if($scope.keepTime)
                handleOvertime(Timer, initTime);

        }, $scope.Prefs.timeBeforeNotification*1000)
    };

    function handleOvertime(timer, initTime){
        var timeBeforeUserClicked = Math.round((new Date() - initTime)/1000);

        otherTimerIx = timer.ix==0 ? 1 : 0;
        var XT = $scope.Timers[jName][otherTimerIx];

        var toAdd = timer.initVals + timeBeforeUserClicked;

        if(timeBeforeUserClicked > $scope.Prefs.delayBeforeFine){

            $scope.safeApply(timer.blink = true);

            //display overtime during 3 sec while display is blinking
            pump(timer, timeBeforeUserClicked);

            setTimeout(function(){
                if(timer.initVals - timeBeforeUserClicked > 10)
                    timer.time = timer.initVals - timeBeforeUserClicked;
                else{
                    XT.time += timeBeforeUserClicked;
                    timer.time = timer.initVals;
                }

                postWarning(timer, toAdd);
                pump(XT, XT.time);

                timer.blink = false;

            }, 4100);

        }else{
            timer.time = timer.initVals;
            postWarning(timer, timer.initVals);
        }
    };

    function postWarning(timer, add){
        pump(timer, timer.time);

        timer.mode = 'stopped';
        $scope.run($scope.Timers[jName][otherTimerIx]);

        timer.total += add;
        if(timer.total>0){
            $scope.safeApply(timer.total);
            localStorage.setItem('timer' +timer.ix+'_'+jName+'.total', ''+timer.total)
        }
    }

    function vibrate(msg, title){
        var Notification = navigator.notification;
        if(Notification){
            for(i=0; i<3; i++){
                Notification.vibrate(3000);
                setTimeout(2000);
            }
            Notification.alert(msg, null/*callback*/, title, 'TIME TO REST')
        }else{
            alert(title ? (title + ": "+ msg) : msg);
        }
    }

    function pump (timer, obj){
        $scope.safeApply(function(){
            timer.time = obj;
        })
    };

    $scope.safeApply = function(fn) {
        if (!$scope.$$phase) $scope.$apply(fn);
    };

    init();
}])
