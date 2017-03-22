# jqGrid
jqGrid项目使用总结

最近项目中用jqGrid来实现页面中的表格数据，使用过程中感触颇多，总体发现jqGrid灵活性还是很好的，我使用过程中参考了API文档，感觉这个API文档挺全面的，文档地址为：
[jqGrid实例中文版](http://blog.mn886.net/jqGrid/) 

下面是我在项目中遇到问题的总结：

#### 1.onSelectRow的问题

```javascript
onSelectRow: function(rowid, status){
    if(status){
        //选中行时执行的操作
    }else{
        //取消选中行时执行的操作
    }    
}
```
我的项目中的需求是选中一行或者多行时，要根据每一行的某两个值判断是否可以点击上面的按钮，如果可以，某个按钮会变亮可点，如果不可以，某个按钮会变暗不可点，具体效果如图所示

![](https://github.com/FloweringVivian/jqGrid/blob/master/images/readme.jpg) 

onSelectRow有两个参数，rowid代表行id，status代表选中状态，选中时为true，取消选中时为false，所以我需要在选中行时把行的数据push到一个数组里，然后取消选中行时在数组里根据行id找到这条数据，然后删除，然后写一个方法来循环这个数组中的数据，进行按钮的是否可点击判断，方法如下：

```javascript
//控制按钮状态
function watchBtn(arrList){
  var toForeverBtn = false;
  var toActivationBtn = false;
  var lossBtn = false;
  var cancelLossBtn = false;
  if(arrList && arrList.length>0){
    for(var i=0;i<arrList.length;i++){
      if(arrList[i].type != 1 || arrList[i].status != 0){  //只有type==1 && status==0(定期激活 正常)才能变更为永久
        toForeverBtn = true;
      };
      if(arrList[i].type != 0 || arrList[i].status != 0){  //只有type==0 && status==0(永久 正常)才能变更为定期激活
        toActivationBtn = true;
      };
      if(arrList[i].type != 1 || (arrList[i].status != 0 && arrList[i].status != 1)){  //只有type==1 && (status==0 || status==1)(定期激活 正常 未激活)才能挂失
        lossBtn = true;
      };
      if(arrList[i].status != 4){  //只有status==4(已挂失)才能取消挂失
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
```
