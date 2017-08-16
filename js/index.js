"use strict";

//控制按钮状态
function watchBtn(arrList){
	var toForeverBtn = false;
	var toActivationBtn = false;
	var lossBtn = false;
	var cancelLossBtn = false;
	if(arrList && arrList.length>0){
		for(var i=0;i<arrList.length;i++){
			if(arrList[i].type != 1 || arrList[i].status != 0){  //只有type==1 && status==0(BBB 正常)才能变更为AAA
				toForeverBtn = true;
			};
			if(arrList[i].type != 0 || arrList[i].status != 0){  //只有type==0 && status==0(AAA 正常)才能变更为BBB
				toActivationBtn = true;
			};
			if(arrList[i].type != 1 || (arrList[i].status != 0 && arrList[i].status != 1)){  //只有type==1 && (status==0 || status==1)(BBB 正常 未开启)才能挂起
				lossBtn = true;
			};
			if(arrList[i].status != 4){  //只有status==4(已挂起)才能取消挂起
				cancelLossBtn = true;
			};
		}
	}else{
		toForeverBtn = false;
		toActivationBtn = false;
		lossBtn = false;
		cancelLossBtn = false;
	}
	//四个按钮状态
	$("#toForever").prop("disabled",toForeverBtn);
	$("#toActivation").prop("disabled",toActivationBtn);
	$("#loss").prop("disabled",lossBtn);
	$("#cancelLoss").prop("disabled",cancelLossBtn);
}

//查看详情
function detail(id){
	var rowList = $("#jqGrid").jqGrid("getRowData", id);
	$("#keyId").html(id);
	$("#keyNumber").html(rowList.keyNumber);
	$("#chipNumber").html(rowList.chipNumber);
	$("#productTime").html(rowList.productTime);
	$("#typeName").html(rowList.typeName);
	$("#statusName").html(rowList.statusName);
	$("#latestTime").html(rowList.latestTime);
};

//历史记录
function historyRecords(id){
	$("#jqGrid-history").jqGrid({
		url: "data/JSONData4.json",
		datatype: "json",
		colModel: [
			{
				label: "变更后",
				name: "changeAfter",
				width: 190
			},
			{
				label: "变更时间",
				name: "changeTime",
				width: 190,
			},
			{
				label: "变更管理员",
				name: "changeUser",
				width: 190
			}
		],
		postdData: {id: id},
		autowidth: true,
		rowNum: 10,
		rowList : [ 10, 20, 30 ],
		pager: "#pager-history"
	})
};
$(function(){
	//jqGrid表格
	var rowArr = [];
	$("#jqGrid").jqGrid({
		url: "data/JSONData5.json",
		datatype: "json",
		type: "post",
		sortorder: "desc",
		colModel: [
			{
				label: "id",
				name: "id",
				width: 80,
				hidden: true
			},
			{
				label: "编号",
				name: "keyNumber",
				width: 100
			},
			{
				label: "序列号",
				name: "chipNumber",
				width: 100
			},
			{
				label: "生产时间",
				name: "productTime",
				width: 80
			},
			{
				label: "开启类型",
				name: "type",
				width: 100,
				hidden: true
			},
			{
				label: "开启类型",
				name: "typeName",
				width: 100,
				formatter: function(cellValue, options, rowObject){
					switch(rowObject.type){
						case 0:
							return "AAA";
							break;
						case 1:
							return "BBB";
							break;
					}
				}
			},
			{
				label: "当前状态",
				name: "status",
				width: 100,
				hidden: true
			},
			{
				label: "当前状态",
				name: "statusName",
				width: 100,
				formatter: function(cellValue, options, rowObject){
					switch(rowObject.status){
						case 0:
							return "正常";
							break;
						case 1:
							return "未开启";
							break;
						case 2:
							return "正在变更为BBB";
							break;
						case 3:
							return "正在变更为AAA";
							break;
						case 4:
							return "已挂起";
							break;
						case 5:
							return "正在取消挂起";
							break;
					}
				}
			},
			{
				label: "最近开启时间",
				name: "latestTime",
				width: 120
			},
			{
				label: "操作",
				name: "operate",
				width: 100,
				formatter: function (value, grid, rows, state) { return "<a href=\"#\" style=\"color:#f60\" data-toggle=\"modal\" data-target=\"#history-modal\"  onclick=\"historyRecords(" + rows.id + ")\">历史变更记录</a><a href=\"#\" style=\"color:#f60;margin-left:10px;\" data-toggle=\"modal\" data-target=\"#detail-modal\" onclick=\"detail(" + rows.id + ")\">查看详情</a>" }
			}
		],
		viewrecords: true,
		autowidth: true,
		height: "auto",
		rowNum: 10,
		rowList : [ 10, 20, 30 ],
		multiselect: true,
		pager: "#pager",
		onSelectRow: function(rowid, status){
			console.log(rowid);
			var rowData = $("#jqGrid").jqGrid("getRowData", rowid);
			if(status){
				rowArr.push(rowData);
			}else{
				for(var i=0;i<rowArr.length;i++){
					if(rowArr[i].id == rowid){
						rowArr.splice(i, 1);
					};
				}
			};
			watchBtn(rowArr);
		},
		onSelectAll: function(aRowids, status){
			rowArr.splice(0,rowArr.length);
			if(status){
				for(var i=0;i<aRowids.length;i++){
					var rowData = $("#jqGrid").jqGrid("getRowData", i);
					rowArr.push(rowData);
				};
			};
			watchBtn(rowArr);
		},
		onPaging: function(){
			rowArr.splice(0,rowArr.length);
			watchBtn(rowArr);
		}
	})

	//下拉选择状态刷新列表
	$("#selectType").change(function(){
		var selType = $(this).find("option:selected").attr("data-type");
		$("#jqGrid").setGridParam({
			postData:{type: selType}
		}).trigger("reloadGrid");
	});

	//按钮操作
	$("#toForever").click(function(){  //变更为永久确定
		var ids = $("#jqGrid").jqGrid('getGridParam','selarrrow');
		$.ajax({
			url: "data/JSONData5.json",
			type: "post",
			dataType: "json",
			data: {
				id: ids
			},
			success: function(data){
				$("#jqGrid").trigger("reloadGrid");
			}
		})
	})

	//初始化
	watchBtn();
})