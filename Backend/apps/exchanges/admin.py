from django.contrib import admin

from .models import ExchangeProposal


@admin.register(ExchangeProposal)
class ExchangeProposalAdmin(admin.ModelAdmin):

    list_display = [
        'id', 'proposer', 'offered_product',
        'requested_product', 'status', 'created_at',
    ]
    list_filter = ['status', 'created_at']
    search_fields = [
        'proposer__email',
        'offered_product__title',
        'requested_product__title',
    ]
    readonly_fields = ['created_at', 'updated_at']
