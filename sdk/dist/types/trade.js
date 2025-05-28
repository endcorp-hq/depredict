export var WinningDirection;
(function (WinningDirection) {
    WinningDirection["NONE"] = "None";
    WinningDirection["YES"] = "Yes";
    WinningDirection["NO"] = "No";
    WinningDirection["DRAW"] = "Draw";
})(WinningDirection || (WinningDirection = {}));
export var OrderDirection;
(function (OrderDirection) {
    OrderDirection["YES"] = "yes";
    OrderDirection["NO"] = "no";
})(OrderDirection || (OrderDirection = {}));
export var OrderStatus;
(function (OrderStatus) {
    OrderStatus["INIT"] = "init";
    OrderStatus["OPEN"] = "open";
    OrderStatus["CLOSED"] = "closed";
    OrderStatus["CLAIMED"] = "claimed";
    OrderStatus["LIQUIDATED"] = "liquidated";
    OrderStatus["WAITING"] = "waiting";
})(OrderStatus || (OrderStatus = {}));
