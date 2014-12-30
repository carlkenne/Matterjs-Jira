    var cardManagement = (function(cards){
  
        var setActiveFlagOnCards = function(){
            var nextSteps = cards.filter(function(c){
                return c.type == "nextStep";
            });            
            nextSteps.forEach(function(c) { 
                c.active = getCardsPointingTo(c).every(function(sc){
                    return sc.type == "issue" || (sc.fields.resolution && sc.fields.resolution.name == "Fixed");
                })
            });
            nextSteps.filter(function(c){
                return (c.fields.resolution && c.fields.resolution.name == "Fixed");
            }).forEach(function(c) {               
                c.active = "fixed";                
            });
        };
        
    	var getAllConnectedCards = function(card) {
            var all = getIdsRecursivlyPointingTo(card)
                .concat(getIdsRecursivlyPointingFrom(card))
                .map(function(_id) {
                    return getCardBy(_id);
                });
            return all;
        }

        var getIdsRecursivlyPointingTo = function(card){
            return getCardsPointingTo(card)
                .selectMany(function(c) {
                    return getIdsRecursivlyPointingTo(c);
                }).concat(card.id);
        }

        var getIdsRecursivlyPointingFrom = function(card){
            return getCardsPointingFrom(card)
                .selectMany(function(c) {
                    return getIdsRecursivlyPointingFrom(c);
                }).concat(card.id);
        }
        
        var getCardsPointingFrom = function(card){
            return card.fields.issuelinks ? card.fields.issuelinks.filter(function(c) { 
            		return c.outwardIssue;
        	    }).map(function(c){ 
    	        	return getCardBy(c.outwardIssue.id); 
	            }) : [];
        }
        
        var getCardBy = function(id){
            var _cards = cards.filter(function(card){ return card.id == id});
            console.assert(_cards.length == 1, "could not find card with id: " + id);
            return _cards[0];
        }
        
        var getIdsPointingTo = function(card){
            return card.fields.issuelinks ? card.fields.issuelinks.filter(function(c) { 
            		return c.inwardIssue;
        	    }).map(function(c){ 
    	        	return c.inwardIssue.id; 
	            }) : [];
        }

        var getIdsPointingFrom = function(card){
                return card.fields.issuelinks ? card.fields.issuelinks.filter(function(c) { 
            		return c.outwardIssue;
        	    }).map(function(c){ 
    	        	return c.outwardIssue.id; 
	            }) : [];
        }

        var getCardsPointingTo = function(card){
            return card.fields.issuelinks ? card.fields.issuelinks.filter(function(c) { 
            		return c.inwardIssue;
        	    }).map(function(c){ 
    	        	return getCardBy(c.inwardIssue.id); 
	            }) : [];
        }
      
      setActiveFlagOnCards();
      
      return {
      	getAllConnectedCards : getAllConnectedCards, 
      	getIdsPointingTo : getIdsPointingTo,
        getCards : function(){
        	return cards;
        }
      };
    });
