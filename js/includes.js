module.exports.inAnArray = function (item, array){
	return !(array.indexOf(item) == -1);
}

module.exports.inAnObject = function (item, obj){
	var value = obj[item];

	return (value != undefined);
}